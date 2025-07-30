import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const url = new URL(req.url)
    const path = url.pathname.replace('/functions/v1/customer-checkin', '')
    const method = req.method

    console.log(`${method} ${path}`)

    // Route handling for customer-facing endpoints (no auth required)
    switch (path) {
      case '/locations':
        return await handlePublicLocations(req, supabaseClient)
      case '/location':
        return await handleLocationDetails(req, supabaseClient)
      case '/checkin':
        return await handlePublicCheckin(req, supabaseClient)
      case '/queue/join':
        return await handleJoinQueue(req, supabaseClient)
      case '/queue/status':
        return await handleQueueStatus(req, supabaseClient)
      case '/services':
        return await handlePublicServices(req, supabaseClient)
      default:
        return new Response(
          JSON.stringify({ error: 'Not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handlePublicLocations(req: Request, supabase: any) {
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { data, error } = await supabase
    .from('locations')
    .select('id, name, address, phone, email, settings')
    .eq('is_active', true)

  if (error) {
    throw error
  }

  // Add current queue stats to each location
  const locationsWithStats = await Promise.all(
    data.map(async (location: any) => {
      const { count } = await supabase
        .from('queue_entries')
        .select('*', { count: 'exact', head: true })
        .eq('location_id', location.id)
        .eq('status', 'waiting')

      return {
        ...location,
        currentQueue: count || 0,
        estimatedWait: (count || 0) * 25, // Rough estimate
      }
    })
  )

  return new Response(
    JSON.stringify(locationsWithStats),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleLocationDetails(req: Request, supabase: any) {
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const url = new URL(req.url)
  const locationId = url.searchParams.get('id')

  if (!locationId) {
    return new Response(
      JSON.stringify({ error: 'Location ID required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('id', locationId)
    .eq('is_active', true)
    .single()

  if (error) {
    throw error
  }

  // Get current queue stats
  const { count } = await supabase
    .from('queue_entries')
    .select('*', { count: 'exact', head: true })
    .eq('location_id', locationId)
    .eq('status', 'waiting')

  const locationWithStats = {
    ...data,
    currentQueue: count || 0,
    estimatedWait: (count || 0) * 25,
  }

  return new Response(
    JSON.stringify(locationWithStats),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handlePublicServices(req: Request, supabase: any) {
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const url = new URL(req.url)
  const locationId = url.searchParams.get('location_id')

  if (!locationId) {
    return new Response(
      JSON.stringify({ error: 'Location ID required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { data, error } = await supabase
    .from('services')
    .select('id, name, description, estimated_duration, price, category')
    .eq('location_id', locationId)
    .eq('is_active', true)
    .order('name')

  if (error) {
    throw error
  }

  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handlePublicCheckin(req: Request, supabase: any) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const checkinData = await req.json()

  // Generate unique checkin code
  const checkinCode = Math.random().toString(36).substring(2, 8).toUpperCase()

  const { data, error } = await supabase
    .from('checkin_entries')
    .insert({
      ...checkinData,
      checkin_code: checkinCode,
      checkin_time: new Date().toISOString(),
    })
    .select()

  if (error) {
    throw error
  }

  // Update customer history
  await supabase
    .from('customer_history')
    .upsert({
      phone: checkinData.customer_phone,
      name: checkinData.customer_name,
      email: checkinData.customer_email,
      last_visit: new Date().toISOString(),
      preferred_services: checkinData.services || [],
    }, {
      onConflict: 'phone'
    })

  return new Response(
    JSON.stringify({
      success: true,
      checkinCode,
      data: data[0],
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleJoinQueue(req: Request, supabase: any) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const queueData = await req.json()

  // Calculate position in queue
  const { count } = await supabase
    .from('queue_entries')
    .select('*', { count: 'exact', head: true })
    .eq('location_id', queueData.location_id)
    .eq('status', 'waiting')

  const position = (count || 0) + 1

  const { data, error } = await supabase
    .from('queue_entries')
    .insert({
      ...queueData,
      position,
      status: 'waiting',
      joined_at: new Date().toISOString(),
    })
    .select()

  if (error) {
    throw error
  }

  // Update customer history
  await supabase
    .from('customer_history')
    .upsert({
      phone: queueData.customer_phone,
      name: queueData.customer_name,
      email: queueData.customer_email,
      last_visit: new Date().toISOString(),
      preferred_services: queueData.services || [],
      visit_count: 1,
    }, {
      onConflict: 'phone',
      ignoreDuplicates: false,
    })

  return new Response(
    JSON.stringify({
      success: true,
      position,
      estimatedWait: position * 25,
      data: data[0],
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleQueueStatus(req: Request, supabase: any) {
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const url = new URL(req.url)
  const entryId = url.searchParams.get('entry_id')
  const customerPhone = url.searchParams.get('customer_phone')
  const locationId = url.searchParams.get('location_id')

  if (!entryId && !customerPhone) {
    return new Response(
      JSON.stringify({ error: 'Entry ID or customer phone required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  let query = supabase.from('queue_entries').select('*')

  if (entryId) {
    query = query.eq('id', entryId)
  } else if (customerPhone && locationId) {
    query = query
      .eq('customer_phone', customerPhone)
      .eq('location_id', locationId)
      .in('status', ['waiting', 'called', 'in_progress'])
      .order('joined_at', { ascending: false })
      .limit(1)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  if (!data || data.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Queue entry not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const queueEntry = Array.isArray(data) ? data[0] : data

  // Calculate current position if waiting
  if (queueEntry.status === 'waiting') {
    const { count } = await supabase
      .from('queue_entries')
      .select('*', { count: 'exact', head: true })
      .eq('location_id', queueEntry.location_id)
      .eq('status', 'waiting')
      .lt('position', queueEntry.position)

    queueEntry.currentPosition = (count || 0) + 1
    queueEntry.estimatedWait = queueEntry.currentPosition * 25
  } else {
    queueEntry.currentPosition = queueEntry.status === 'called' ? 0 : null
    queueEntry.estimatedWait = 0
  }

  return new Response(
    JSON.stringify(queueEntry),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}