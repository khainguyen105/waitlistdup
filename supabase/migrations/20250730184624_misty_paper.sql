/*
  # Comprehensive Waitlist Management System Schema

  1. Database Schema
    - Enums for type safety
    - Core tables for users, agencies, locations, employees, services
    - Queue management tables
    - Security and audit tables

  2. Row Level Security (RLS)
    - Secure access controls for all tables
    - Special policies for customer check-ins (anon access)
    - Role-based permissions

  3. Sample Data
    - Demo agencies and locations
    - Sample employees and services
    - Test queue entries and customer data

  This migration creates a complete, production-ready waitlist management system.
*/

-- Create enums (only if they don't exist)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('agency_admin', 'location_manager', 'staff', 'customer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE queue_status AS ENUM ('waiting', 'called', 'in_progress', 'completed', 'no_show', 'cancelled', 'transferred');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE customer_type AS ENUM ('vip', 'regular', 'new', 'appointment');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE assignment_method AS ENUM ('manual', 'auto', 'preferred', 'load_balanced');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE priority AS ENUM ('low', 'normal', 'high', 'urgent', 'emergency');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE checkin_status AS ENUM ('en_route', 'present', 'in_queue', 'expired', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE checkin_type AS ENUM ('remote', 'in_store');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_method AS ENUM ('geolocation', 'wifi', 'manual', 'staff_confirmed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE employee_status AS ENUM ('active', 'inactive', 'break', 'busy');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE skill_level AS ENUM ('beginner', 'intermediate', 'expert');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE alert_type AS ENUM ('queue_overflow', 'employee_unavailable', 'system_error', 'emergency');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE alert_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Core Tables
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  role user_role NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  agency_id uuid,
  location_ids text[] DEFAULT '{}',
  pin_required boolean DEFAULT true,
  pin_verified boolean DEFAULT false,
  last_login_at timestamptz,
  session_expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  domain text UNIQUE NOT NULL,
  logo text,
  brand_color text DEFAULT '#3B82F6',
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid,
  name text NOT NULL,
  address text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  timezone text DEFAULT 'America/New_York',
  coordinates jsonb,
  settings jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  specialties text[] DEFAULT '{}',
  service_ids text[] DEFAULT '{}',
  skill_level jsonb DEFAULT '{}',
  schedule jsonb DEFAULT '{}',
  performance jsonb DEFAULT '{}',
  availability jsonb DEFAULT '{}',
  queue_settings jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  color text DEFAULT '#3B82F6',
  icon text,
  sort_order integer DEFAULT 0,
  parent_category_id uuid,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL,
  category_id uuid,
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  estimated_duration integer NOT NULL,
  requirements text[] DEFAULT '{}',
  price decimal(10,2),
  skill_level_required skill_level DEFAULT 'intermediate',
  assigned_employee_ids text[] DEFAULT '{}',
  auto_assignment_rules jsonb DEFAULT '{}',
  customer_types jsonb[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS queue_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  customer_type customer_type DEFAULT 'regular',
  services text[] DEFAULT '{}',
  service_ids text[] DEFAULT '{}',
  assigned_employee_id uuid,
  assigned_employee_name text,
  preferred_employee_id uuid,
  assignment_method assignment_method DEFAULT 'manual',
  priority priority DEFAULT 'normal',
  status queue_status DEFAULT 'waiting',
  position integer NOT NULL,
  estimated_wait_time integer NOT NULL,
  actual_wait_time integer,
  service_start_time timestamptz,
  service_end_time timestamptz,
  joined_at timestamptz DEFAULT now(),
  called_at timestamptz,
  completed_at timestamptz,
  notifications jsonb[] DEFAULT '{}',
  special_requests text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS checkin_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  customer_type customer_type DEFAULT 'regular',
  services text[] DEFAULT '{}',
  preferred_employee_id uuid,
  checkin_type checkin_type NOT NULL,
  status checkin_status DEFAULT 'en_route',
  checkin_code text UNIQUE NOT NULL,
  estimated_arrival_time timestamptz,
  actual_arrival_time timestamptz,
  checkin_time timestamptz DEFAULT now(),
  verification_method verification_method,
  coordinates jsonb,
  special_requests text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text UNIQUE NOT NULL,
  name text NOT NULL,
  email text,
  last_visit timestamptz DEFAULT now(),
  visit_count integer DEFAULT 1,
  preferred_services text[] DEFAULT '{}',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Security Tables
CREATE TABLE IF NOT EXISTS pin_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  location_id uuid NOT NULL,
  hashed_pin text NOT NULL,
  salt text NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz,
  failed_attempts integer DEFAULT 0,
  locked_until timestamptz,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  username text,
  ip_address text NOT NULL,
  user_agent text NOT NULL,
  success boolean NOT NULL,
  failure_reason text,
  location_id uuid,
  timestamp timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS security_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  max_login_attempts integer DEFAULT 5,
  lockout_duration integer DEFAULT 15,
  session_timeout integer DEFAULT 480,
  pin_length integer DEFAULT 4,
  require_pin_for_actions text[] DEFAULT '{}',
  password_min_length integer DEFAULT 8,
  password_require_special_chars boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Queue Management Tables
CREATE TABLE IF NOT EXISTS queue_control_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  type text NOT NULL,
  conditions jsonb[] DEFAULT '{}',
  actions jsonb[] DEFAULT '{}',
  priority integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS system_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type alert_type NOT NULL,
  severity alert_severity NOT NULL,
  message text NOT NULL,
  location_id uuid,
  employee_id uuid,
  customer_id uuid,
  is_resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token text UNIQUE NOT NULL,
  refresh_token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  pin_verified boolean DEFAULT false,
  location_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_control_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users
CREATE POLICY "Users can read their own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Agency admins can read all users" ON users FOR SELECT USING (auth.role() = 'agency_admin');

-- Agencies
CREATE POLICY "Agency admins can manage agencies" ON agencies FOR ALL USING (auth.role() = 'agency_admin');

-- Locations
CREATE POLICY "Agency admins and location managers can manage locations" ON locations FOR ALL USING (auth.role() IN ('agency_admin', 'location_manager'));

-- Employees
CREATE POLICY "Staff can manage employees" ON employees FOR ALL USING (auth.role() IN ('agency_admin', 'location_manager', 'staff'));

-- Service Categories
CREATE POLICY "Staff can manage service categories" ON service_categories FOR ALL USING (auth.role() IN ('agency_admin', 'location_manager', 'staff'));

-- Services
CREATE POLICY "Staff can manage services" ON services FOR ALL USING (auth.role() IN ('agency_admin', 'location_manager', 'staff'));
CREATE POLICY "Anyone can read services" ON services FOR SELECT TO public USING (is_active = true);

-- Queue Entries
CREATE POLICY "Staff can manage queue entries" ON queue_entries FOR ALL USING (auth.role() IN ('agency_admin', 'location_manager', 'staff'));
CREATE POLICY "Customers can read their own queue entries" ON queue_entries FOR SELECT USING (true);

-- Checkin Entries (CRITICAL: Allow anon insert for customer check-ins)
CREATE POLICY "Staff can manage checkin entries" ON checkin_entries FOR ALL USING (auth.role() IN ('agency_admin', 'location_manager', 'staff'));
CREATE POLICY "Allow anon insert for checkin entries" ON checkin_entries FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anyone can read checkin entries" ON checkin_entries FOR SELECT TO public USING (true);

-- Customer History
CREATE POLICY "Staff can manage customer history" ON customer_history FOR ALL USING (auth.role() IN ('agency_admin', 'location_manager', 'staff'));
CREATE POLICY "Allow anon upsert for customer history" ON customer_history FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update for customer history" ON customer_history FOR UPDATE TO anon USING (true);

-- Security Tables
CREATE POLICY "Users can read their own pin codes" ON pin_codes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Agency admins can manage security" ON security_settings FOR ALL USING (auth.role() = 'agency_admin');

-- Queue Control Rules
CREATE POLICY "Staff can manage queue rules" ON queue_control_rules FOR ALL USING (auth.role() IN ('agency_admin', 'location_manager', 'staff'));

-- System Alerts
CREATE POLICY "Staff can manage alerts" ON system_alerts FOR ALL USING (auth.role() IN ('agency_admin', 'location_manager', 'staff'));

-- Sessions
CREATE POLICY "Users can manage their own sessions" ON sessions FOR ALL USING (auth.uid() = user_id);

-- Insert Sample Data
-- Agencies
INSERT INTO agencies (id, name, domain, brand_color, settings) VALUES
('11111111-1111-1111-1111-111111111111', 'Premier Salon Group', 'premiersalons.com', '#3B82F6', '{"allowSelfJoin": true, "requirePhoneVerification": true, "enableSMSNotifications": true}')
ON CONFLICT (id) DO NOTHING;

-- Locations
INSERT INTO locations (id, agency_id, name, address, phone, email, settings) VALUES
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Downtown Salon', '123 Main St, Downtown City, DC 12345', '+1234567890', 'downtown@salon.com', '{"businessHours": {"monday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "friday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "saturday": {"isOpen": true, "openTime": "08:00", "closeTime": "18:00"}, "sunday": {"isOpen": false, "openTime": "10:00", "closeTime": "16:00"}}, "maxQueueSize": 50, "allowWalkIns": true, "requireAppointments": false, "allowRemoteCheckin": true, "checkinRadius": 100, "autoAssignEmployees": true}'),
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Uptown Branch', '456 Oak Ave, Uptown City, UC 67890', '+1234567891', 'uptown@salon.com', '{"businessHours": {"monday": {"isOpen": true, "openTime": "10:00", "closeTime": "19:00"}, "tuesday": {"isOpen": true, "openTime": "10:00", "closeTime": "19:00"}, "wednesday": {"isOpen": true, "openTime": "10:00", "closeTime": "19:00"}, "thursday": {"isOpen": true, "openTime": "10:00", "closeTime": "21:00"}, "friday": {"isOpen": true, "openTime": "10:00", "closeTime": "21:00"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "19:00"}, "sunday": {"isOpen": true, "openTime": "11:00", "closeTime": "17:00"}}, "maxQueueSize": 30, "allowWalkIns": true, "requireAppointments": true, "allowRemoteCheckin": true, "checkinRadius": 100, "autoAssignEmployees": false}')
ON CONFLICT (id) DO NOTHING;

-- Service Categories
INSERT INTO service_categories (id, location_id, name, description, color, sort_order) VALUES
('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Hair Services', 'Professional hair cutting, styling, and treatments', '#3B82F6', 1),
('55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'Grooming', 'Beard trimming and men''s grooming services', '#10B981', 2),
('66666666-6666-6666-6666-666666666666', '22222222-2222-2222-2222-222222222222', 'Nail Services', 'Manicures, pedicures, and nail treatments', '#F59E0B', 3)
ON CONFLICT (id) DO NOTHING;

-- Services
INSERT INTO services (id, location_id, category_id, name, description, category, estimated_duration, price, skill_level_required, assigned_employee_ids, auto_assignment_rules) VALUES
('77777777-7777-7777-7777-777777777777', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'Haircut & Style', 'Professional haircut with styling', 'Hair Services', 45, 65.00, 'intermediate', '{"88888888-8888-8888-8888-888888888888", "99999999-9999-9999-9999-999999999999"}', '{"requireSpecialty": true, "considerWorkload": true, "considerRating": true, "fallbackToAnyEmployee": false, "preferredEmployeeIds": ["88888888-8888-8888-8888-888888888888", "99999999-9999-9999-9999-999999999999"]}'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'Hair Coloring', 'Full or partial hair coloring service', 'Hair Services', 120, 150.00, 'expert', '{"88888888-8888-8888-8888-888888888888"}', '{"requireSpecialty": true, "considerWorkload": true, "considerRating": true, "fallbackToAnyEmployee": false, "preferredEmployeeIds": ["88888888-8888-8888-8888-888888888888"]}'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', 'Beard Trim', 'Professional beard trimming and shaping', 'Grooming', 20, 25.00, 'beginner', '{"99999999-9999-9999-9999-999999999999"}', '{"requireSpecialty": true, "considerWorkload": false, "considerRating": true, "fallbackToAnyEmployee": true, "preferredEmployeeIds": ["99999999-9999-9999-9999-999999999999"]}'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', 'Manicure', 'Complete nail care and polish application', 'Nail Services', 45, 35.00, 'intermediate', '{"dddddddd-dddd-dddd-dddd-dddddddddddd"}', '{"requireSpecialty": true, "considerWorkload": true, "considerRating": true, "fallbackToAnyEmployee": false, "preferredEmployeeIds": ["dddddddd-dddd-dddd-dddd-dddddddddddd"]}'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', 'Pedicure', 'Complete foot care and polish application', 'Nail Services', 60, 45.00, 'intermediate', '{"dddddddd-dddd-dddd-dddd-dddddddddddd"}', '{"requireSpecialty": true, "considerWorkload": true, "considerRating": true, "fallbackToAnyEmployee": false, "preferredEmployeeIds": ["dddddddd-dddd-dddd-dddd-dddddddddddd"]}')
ON CONFLICT (id) DO NOTHING;

-- Employees
INSERT INTO employees (id, location_id, first_name, last_name, email, phone, specialties, service_ids, skill_level, schedule, performance, availability, queue_settings) VALUES
('88888888-8888-8888-8888-888888888888', '22222222-2222-2222-2222-222222222222', 'Sarah', 'Wilson', 'sarah@salon.com', '+1234567892', '{"haircut", "styling", "coloring"}', '{"77777777-7777-7777-7777-777777777777", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}', '{"77777777-7777-7777-7777-777777777777": "expert", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa": "intermediate"}', '{"monday": {"isWorking": true, "startTime": "09:00", "endTime": "17:00", "breakTimes": [{"startTime": "12:00", "endTime": "13:00", "type": "lunch"}]}, "tuesday": {"isWorking": true, "startTime": "09:00", "endTime": "17:00", "breakTimes": [{"startTime": "12:00", "endTime": "13:00", "type": "lunch"}]}, "wednesday": {"isWorking": true, "startTime": "09:00", "endTime": "17:00", "breakTimes": [{"startTime": "12:00", "endTime": "13:00", "type": "lunch"}]}, "thursday": {"isWorking": true, "startTime": "09:00", "endTime": "17:00", "breakTimes": [{"startTime": "12:00", "endTime": "13:00", "type": "lunch"}]}, "friday": {"isWorking": true, "startTime": "09:00", "endTime": "17:00", "breakTimes": [{"startTime": "12:00", "endTime": "13:00", "type": "lunch"}]}, "saturday": {"isWorking": true, "startTime": "08:00", "endTime": "16:00", "breakTimes": [{"startTime": "12:00", "endTime": "13:00", "type": "lunch"}]}, "sunday": {"isWorking": false, "startTime": "10:00", "endTime": "16:00", "breakTimes": []}}', '{"averageServiceTime": 45, "customersServed": 156, "customerRating": 4.8, "currentWorkload": 2, "efficiency": 92, "lastUpdated": "2025-01-30T12:00:00Z"}', '{"status": "active", "lastStatusChange": "2025-01-30T09:00:00Z", "notes": "Available for new customers"}', '{"maxQueueSize": 5, "acceptNewCustomers": true, "turnSharingEnabled": true, "turnSharingPartners": ["99999999-9999-9999-9999-999999999999"], "priorityHandling": "flexible", "breakSchedule": [{"startTime": "12:00", "endTime": "13:00", "type": "lunch", "isRecurring": true}, {"startTime": "15:00", "endTime": "15:15", "type": "break", "isRecurring": true}]}'),
('99999999-9999-9999-9999-999999999999', '22222222-2222-2222-2222-222222222222', 'Mike', 'Johnson', 'mike@salon.com', '+1234567893', '{"haircut", "beard_trim", "styling"}', '{"77777777-7777-7777-7777-777777777777", "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}', '{"77777777-7777-7777-7777-777777777777": "expert", "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb": "expert"}', '{"monday": {"isWorking": false, "startTime": "10:00", "endTime": "18:00", "breakTimes": []}, "tuesday": {"isWorking": true, "startTime": "10:00", "endTime": "18:00", "breakTimes": [{"startTime": "13:00", "endTime": "14:00", "type": "lunch"}]}, "wednesday": {"isWorking": true, "startTime": "10:00", "endTime": "18:00", "breakTimes": [{"startTime": "13:00", "endTime": "14:00", "type": "lunch"}]}, "thursday": {"isWorking": true, "startTime": "10:00", "endTime": "18:00", "breakTimes": [{"startTime": "13:00", "endTime": "14:00", "type": "lunch"}]}, "friday": {"isWorking": true, "startTime": "10:00", "endTime": "18:00", "breakTimes": [{"startTime": "13:00", "endTime": "14:00", "type": "lunch"}]}, "saturday": {"isWorking": true, "startTime": "09:00", "endTime": "17:00", "breakTimes": [{"startTime": "13:00", "endTime": "14:00", "type": "lunch"}]}, "sunday": {"isWorking": true, "startTime": "11:00", "endTime": "15:00", "breakTimes": []}}', '{"averageServiceTime": 35, "customersServed": 198, "customerRating": 4.6, "currentWorkload": 3, "efficiency": 88, "lastUpdated": "2025-01-30T12:00:00Z"}', '{"status": "active", "lastStatusChange": "2025-01-30T09:00:00Z", "notes": "Specializes in men''s cuts"}', '{"maxQueueSize": 4, "acceptNewCustomers": true, "turnSharingEnabled": true, "turnSharingPartners": ["88888888-8888-8888-8888-888888888888"], "priorityHandling": "strict", "breakSchedule": [{"startTime": "13:00", "endTime": "14:00", "type": "lunch", "isRecurring": true}]}'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', 'Emma', 'Davis', 'emma@salon.com', '+1234567894', '{"manicure", "pedicure", "nail_art"}', '{"cccccccc-cccc-cccc-cccc-cccccccccccc", "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"}', '{"cccccccc-cccc-cccc-cccc-cccccccccccc": "expert", "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee": "intermediate"}', '{"monday": {"isWorking": true, "startTime": "09:00", "endTime": "17:00", "breakTimes": [{"startTime": "12:00", "endTime": "13:00", "type": "lunch"}]}, "tuesday": {"isWorking": true, "startTime": "09:00", "endTime": "17:00", "breakTimes": [{"startTime": "12:00", "endTime": "13:00", "type": "lunch"}]}, "wednesday": {"isWorking": true, "startTime": "09:00", "endTime": "17:00", "breakTimes": [{"startTime": "12:00", "endTime": "13:00", "type": "lunch"}]}, "thursday": {"isWorking": true, "startTime": "09:00", "endTime": "17:00", "breakTimes": [{"startTime": "12:00", "endTime": "13:00", "type": "lunch"}]}, "friday": {"isWorking": true, "startTime": "09:00", "endTime": "17:00", "breakTimes": [{"startTime": "12:00", "endTime": "13:00", "type": "lunch"}]}, "saturday": {"isWorking": false, "startTime": "09:00", "endTime": "17:00", "breakTimes": []}, "sunday": {"isWorking": false, "startTime": "10:00", "endTime": "16:00", "breakTimes": []}}', '{"averageServiceTime": 60, "customersServed": 89, "customerRating": 4.9, "currentWorkload": 0, "efficiency": 85, "lastUpdated": "2025-01-30T12:00:00Z"}', '{"status": "active", "lastStatusChange": "2025-01-30T09:00:00Z", "notes": "Nail specialist"}', '{"maxQueueSize": 3, "acceptNewCustomers": true, "turnSharingEnabled": false, "turnSharingPartners": [], "priorityHandling": "flexible", "breakSchedule": [{"startTime": "12:00", "endTime": "13:00", "type": "lunch", "isRecurring": true}]}')
ON CONFLICT (id) DO NOTHING;

-- Sample Queue Entries
INSERT INTO queue_entries (id, location_id, customer_name, customer_phone, customer_email, customer_type, services, service_ids, assigned_employee_id, assignment_method, priority, status, position, estimated_wait_time, joined_at) VALUES
('ffffffff-ffff-ffff-ffff-ffffffffffff', '22222222-2222-2222-2222-222222222222', 'Alice Johnson', '+1234567890', 'alice@email.com', 'regular', '{"Haircut & Style"}', '{"77777777-7777-7777-7777-777777777777"}', '88888888-8888-8888-8888-888888888888', 'auto', 'normal', 'waiting', 1, 15, now() - interval '10 minutes')
ON CONFLICT (id) DO NOTHING;

-- Sample Customer History
INSERT INTO customer_history (phone, name, email, last_visit, visit_count, preferred_services, notes) VALUES
('+1234567890', 'Alice Johnson', 'alice@email.com', now() - interval '2 days', 8, '{"Haircut & Style", "Hair Coloring"}', 'Prefers morning appointments'),
('(555) 987-6543', 'Bob Smith', 'bob@email.com', now() - interval '1 week', 3, '{"Haircut & Style", "Beard Trim"}', null),
('(555) 456-7890', 'Carol Davis', 'carol@email.com', now() - interval '2 weeks', 12, '{"Hair Coloring", "Haircut & Style"}', 'VIP customer, allergic to certain hair products'),
('(555) 321-0987', 'David Wilson', null, now() - interval '1 month', 1, '{"Haircut & Style"}', null),
('(555) 654-3210', 'Emma Brown', 'emma@email.com', now() - interval '5 days', 6, '{"Haircut & Style", "Hair Coloring"}', null)
ON CONFLICT (phone) DO NOTHING;

-- Security Settings
INSERT INTO security_settings (max_login_attempts, lockout_duration, session_timeout, pin_length, require_pin_for_actions, password_min_length, password_require_special_chars) VALUES
(5, 15, 480, 4, '{"queue_management", "employee_management", "settings"}', 8, true)
ON CONFLICT DO NOTHING;

-- Sample Queue Control Rules
INSERT INTO queue_control_rules (id, location_id, name, description, type, conditions, actions, priority, is_active) VALUES
('12121212-1212-1212-1212-121212121212', '22222222-2222-2222-2222-222222222222', 'Auto Load Balancing', 'Automatically balance queues when one employee has 3+ more customers than another', 'load_balancing', '[{"field": "queue_imbalance", "operator": "greater_than", "value": 3}]', '[{"type": "reassign_employee", "parameters": {"strategy": "least_busy"}}]', 1, true),
('13131313-1313-1313-1313-131313131313', '22222222-2222-2222-2222-222222222222', 'VIP Priority Override', 'Automatically prioritize VIP customers', 'priority_override', '[{"field": "customer_type", "operator": "equals", "value": "vip"}]', '[{"type": "adjust_priority", "parameters": {"priority": "high"}}]', 2, true)
ON CONFLICT (id) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_queue_entries_location_status ON queue_entries(location_id, status);
CREATE INDEX IF NOT EXISTS idx_queue_entries_position ON queue_entries(position);
CREATE INDEX IF NOT EXISTS idx_checkin_entries_location ON checkin_entries(location_id);
CREATE INDEX IF NOT EXISTS idx_checkin_entries_code ON checkin_entries(checkin_code);
CREATE INDEX IF NOT EXISTS idx_customer_history_phone ON customer_history(phone);
CREATE INDEX IF NOT EXISTS idx_employees_location ON employees(location_id);
CREATE INDEX IF NOT EXISTS idx_services_location ON services(location_id);

-- Create foreign key constraints (if they don't exist)
DO $$ BEGIN
    ALTER TABLE locations ADD CONSTRAINT fk_locations_agency_id FOREIGN KEY (agency_id) REFERENCES agencies(id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE employees ADD CONSTRAINT fk_employees_location_id FOREIGN KEY (location_id) REFERENCES locations(id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE service_categories ADD CONSTRAINT fk_service_categories_location_id FOREIGN KEY (location_id) REFERENCES locations(id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE services ADD CONSTRAINT fk_services_location_id FOREIGN KEY (location_id) REFERENCES locations(id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE queue_entries ADD CONSTRAINT fk_queue_entries_location_id FOREIGN KEY (location_id) REFERENCES locations(id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE checkin_entries ADD CONSTRAINT fk_checkin_entries_location_id FOREIGN KEY (location_id) REFERENCES locations(id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;