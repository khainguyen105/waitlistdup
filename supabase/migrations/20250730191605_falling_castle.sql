-- Fix RLS policies for customer check-ins and queue management
-- This migration ensures that customers can insert check-ins and queue entries

BEGIN;

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE public.checkin_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Allow anon insert for checkin_entries" ON public.checkin_entries;
DROP POLICY IF EXISTS "Allow anon insert for queue_entries" ON public.queue_entries;
DROP POLICY IF EXISTS "Allow anon insert for customer_history" ON public.customer_history;

-- Create comprehensive policies for checkin_entries
CREATE POLICY "Allow public insert for checkin_entries" 
  ON public.checkin_entries 
  FOR INSERT 
  TO public 
  WITH CHECK (true);

CREATE POLICY "Allow public select for checkin_entries" 
  ON public.checkin_entries 
  FOR SELECT 
  TO public 
  USING (true);

CREATE POLICY "Allow authenticated update for checkin_entries" 
  ON public.checkin_entries 
  FOR UPDATE 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Create comprehensive policies for queue_entries
CREATE POLICY "Allow public insert for queue_entries" 
  ON public.queue_entries 
  FOR INSERT 
  TO public 
  WITH CHECK (true);

CREATE POLICY "Allow public select for queue_entries" 
  ON public.queue_entries 
  FOR SELECT 
  TO public 
  USING (true);

CREATE POLICY "Allow authenticated update for queue_entries" 
  ON public.queue_entries 
  FOR UPDATE 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Create policies for customer_history
CREATE POLICY "Allow public insert for customer_history" 
  ON public.customer_history 
  FOR INSERT 
  TO public 
  WITH CHECK (true);

CREATE POLICY "Allow public select for customer_history" 
  ON public.customer_history 
  FOR SELECT 
  TO public 
  USING (true);

CREATE POLICY "Allow authenticated update for customer_history" 
  ON public.customer_history 
  FOR UPDATE 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Create policies for locations (public read access for customer-facing features)
CREATE POLICY "Allow public select for locations" 
  ON public.locations 
  FOR SELECT 
  TO public 
  USING (is_active = true);

-- Create policies for services (public read access for customer-facing features)
CREATE POLICY "Allow public select for services" 
  ON public.services 
  FOR SELECT 
  TO public 
  USING (is_active = true);

-- Create policies for service_categories (public read access)
CREATE POLICY "Allow public select for service_categories" 
  ON public.service_categories 
  FOR SELECT 
  TO public 
  USING (is_active = true);

COMMIT;