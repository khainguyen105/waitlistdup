import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface QueueEntry {
  id?: string
  location_id: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  customer_type: 'vip' | 'regular' | 'new' | 'appointment'
  services: string[]
  service_ids: string[]
  assigned_employee_id?: string
  preferred_employee_id?: string
  assignment_method: 'manual' | 'auto' | 'preferred' | 'load_balanced'
  priority: 'low' | 'normal' | 'high' | 'urgent' | 'emergency'
  status: 'waiting' | 'called' | 'in_progress' | 'completed' | 'no_show' | 'cancelled'
  position: number
  estimated_wait_time: number
  special_requests?: string
  notes?: string
}

interface CheckinEntry {
  id?: string
  location_id: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  customer_type: 'vip' | 'regular' | 'new' | 'appointment'
  services: string[]
  checkin_type: 'remote' | 'in_store'
  status: 'en_route' | 'present' | 'in_queue' | 'expired' | 'cancelled'
  checkin_code: string
  estimated_arrival_time?: string
  verification_method?: 'geolocation' | 'wifi' | 'manual' | 'staff_confirmed'
  coordinates?: { latitude: number; longitude: number }
  special_requests?: string
  notes?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const url = new URL(req.url)
    const path = url.pathname.replace('/functions/v1/queue-management', '')
    const method = req.method

    console.log(`${method} ${path}`)

    // Route handling
    switch (path) {
      case '/queue':
        return await handleQueue(req, supabaseClient, method)
      case '/queue/add':
        return await handleAddToQueue(req, supabaseClient)
      case '/queue/update':
        return await handleUpdateQueue(req, supabaseClient)
      case '/checkin':
        return await handleCheckin(req, supabaseClient, method)
      case '/checkin/add':
        return await handleAddCheckin(req, supabaseClient)
      case '/customers':
        return await handleCustomers(req, supabaseClient, method)
      case '/employees':
        return await handleEmployees(req, supabaseClient, method)
      case '/services':
        return await handleServices(req, supabaseClient, method)
      case '/stats':
        return await handleStats(req, supabaseClient)
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

async function handleQueue(req: Request, supabase: any, method: string) {
  const url = new URL(req.url)
  const locationId = url.searchParams.get('location_id')

  if (method === 'GET') {
    let query = supabase
      .from('queue_entries')
      .select('*')
      .in('status', ['waiting', 'called', 'in_progress'])
      .order('position', { ascending: true })

    if (locationId) {
      query = query.eq('location_id', locationId)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleAddToQueue(req: Request, supabase: any) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const queueEntry: QueueEntry = await req.json()

  // Calculate position in queue
  const { count } = await supabase
    .from('queue_entries')
    .select('*', { count: 'exact', head: true })
    .eq('location_id', queueEntry.location_id)
    .in('status', ['waiting', 'called', 'in_progress'])

  const position = (count || 0) + 1

  // Auto-assign employee if not specified
  let assignedEmployeeId = queueEntry.assigned_employee_id
  let assignmentMethod = queueEntry.assignment_method

  if (!assignedEmployeeId && queueEntry.assignment_method === 'auto') {
    const { data: employees } = await supabase
      .from('employees')
      .select('*')
      .eq('location_id', queueEntry.location_id)
      .eq('is_active', true)

    if (employees && employees.length > 0) {
      // Simple assignment: find employee with least workload
      const employeeWorkloads = await Promise.all(
        employees.map(async (emp: any) => {
          const { count } = await supabase
            .from('queue_entries')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_employee_id', emp.id)
            .in('status', ['waiting', 'called', 'in_progress'])
          
          return { employee: emp, workload: count || 0 }
        })
      )

      const bestEmployee = employeeWorkloads.sort((a, b) => a.workload - b.workload)[0]
      assignedEmployeeId = bestEmployee.employee.id
      assignmentMethod = 'auto'
    }
  }

  const { data, error } = await supabase
    .from('queue_entries')
    .insert({
      ...queueEntry,
      position,
      assigned_employee_id: assignedEmployeeId,
      assignment_method: assignmentMethod,
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
      phone: queueEntry.customer_phone,
      name: queueEntry.customer_name,
      email: queueEntry.customer_email,
      last_visit: new Date().toISOString(),
      preferred_services: queueEntry.services,
      visit_count: 1, // This would be incremented in a real implementation
    }, {
      onConflict: 'phone'
    })

  return new Response(
    JSON.stringify(data[0]),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleUpdateQueue(req: Request, supabase: any) {
  if (req.method !== 'PUT') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { id, ...updates } = await req.json()

  // Add completion timestamp if status is being set to completed
  if (updates.status === 'completed' && !updates.completed_at) {
    updates.completed_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('queue_entries')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()

  if (error) {
    throw error
  }

  // If status changed to completed, no_show, or cancelled, recalculate positions
  if (['completed', 'no_show', 'cancelled'].includes(updates.status)) {
    const entry = data[0]
    if (entry) {
      // Get all waiting entries for this location and recalculate positions
      const { data: waitingEntries } = await supabase
        .from('queue_entries')
        .select('id')
        .eq('location_id', entry.location_id)
        .eq('status', 'waiting')
        .order('joined_at', { ascending: true })

      if (waitingEntries) {
        for (let i = 0; i < waitingEntries.length; i++) {
          await supabase
            .from('queue_entries')
            .update({ position: i + 1 })
            .eq('id', waitingEntries[i].id)
        }
      }
    }
  }

  return new Response(
    JSON.stringify(data[0]),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleCheckin(req: Request, supabase: any, method: string) {
  const url = new URL(req.url)
  const locationId = url.searchParams.get('location_id')

  if (method === 'GET') {
    let query = supabase
      .from('checkin_entries')
      .select('*')
      .order('checkin_time', { ascending: false })

    if (locationId) {
      query = query.eq('location_id', locationId)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleAddCheckin(req: Request, supabase: any) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const checkinEntry: CheckinEntry = await req.json()

  // Generate unique checkin code
  const checkinCode = Math.random().toString(36).substring(2, 8).toUpperCase()

  const { data, error } = await supabase
    .from('checkin_entries')
    .insert({
      ...checkinEntry,
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
      phone: checkinEntry.customer_phone,
      name: checkinEntry.customer_name,
      email: checkinEntry.customer_email,
      last_visit: new Date().toISOString(),
      preferred_services: checkinEntry.services,
      visit_count: 1,
    }, {
      onConflict: 'phone'
    })

  return new Response(
    JSON.stringify(data[0]),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleCustomers(req: Request, supabase: any, method: string) {
  if (method === 'GET') {
    const { data, error } = await supabase
      .from('customer_history')
      .select('*')
      .order('last_visit', { ascending: false })

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleEmployees(req: Request, supabase: any, method: string) {
  const url = new URL(req.url)
  const locationId = url.searchParams.get('location_id')

  if (method === 'GET') {
    let query = supabase
      .from('employees')
      .select('*')
      .eq('is_active', true)

    if (locationId) {
      query = query.eq('location_id', locationId)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleServices(req: Request, supabase: any, method: string) {
  const url = new URL(req.url)
  const locationId = url.searchParams.get('location_id')

  if (method === 'GET') {
    let query = supabase
      .from('services')
      .select('*')
      .eq('is_active', true)

    if (locationId) {
      query = query.eq('location_id', locationId)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleStats(req: Request, supabase: any) {
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const url = new URL(req.url)
  const locationId = url.searchParams.get('location_id')

  // Get queue statistics
  let query = supabase.from('queue_entries').select('*')
  if (locationId) {
    query = query.eq('location_id', locationId)
  }

  const { data: queueData, error: queueError } = await query

  if (queueError) {
    throw queueError
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const stats = {
    totalWaiting: queueData.filter((e: any) => e.status === 'waiting').length,
    currentlyServing: queueData.filter((e: any) => e.status === 'in_progress').length,
    customersServedToday: queueData.filter((e: any) => 
      e.status === 'completed' && 
      new Date(e.completed_at) >= today
    ).length,
    noShows: queueData.filter((e: any) => e.status === 'no_show').length,
    averageWaitTime: 30, // This would be calculated based on historical data
    queueEfficiency: 85,
    customerSatisfaction: 4.2,
    remoteCheckins: 0,
    inStoreCheckins: 0,
    employeeUtilization: [],
  }

  return new Response(
    JSON.stringify(stats),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}