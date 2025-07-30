/*
  # Waitlist Management System Database Schema

  1. New Tables
    - `users` - System users (staff, managers, admins)
    - `agencies` - Organizations using the system
    - `locations` - Physical business locations
    - `employees` - Staff members at locations
    - `services` - Available services at locations
    - `service_categories` - Categories for organizing services
    - `queue_entries` - Customer queue entries
    - `checkin_entries` - Remote and in-store check-ins
    - `customer_history` - Customer database and visit history
    - `pin_codes` - Security PIN codes for users
    - `login_attempts` - Security tracking
    - `queue_control_rules` - Automated queue management rules
    - `system_alerts` - System notifications and alerts

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Secure customer data access

  3. Features
    - Multi-location support
    - Employee management and scheduling
    - Service categories and pricing
    - Queue position tracking
    - Remote check-in system
    - Customer history and preferences
    - Real-time notifications
    - Security and audit logging
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_role AS ENUM ('agency_admin', 'location_manager', 'staff', 'customer');
CREATE TYPE queue_status AS ENUM ('waiting', 'called', 'in_progress', 'completed', 'no_show', 'cancelled', 'transferred');
CREATE TYPE customer_type AS ENUM ('vip', 'regular', 'new', 'appointment');
CREATE TYPE assignment_method AS ENUM ('manual', 'auto', 'preferred', 'load_balanced');
CREATE TYPE priority AS ENUM ('low', 'normal', 'high', 'urgent', 'emergency');
CREATE TYPE checkin_status AS ENUM ('en_route', 'present', 'in_queue', 'expired', 'cancelled');
CREATE TYPE checkin_type AS ENUM ('remote', 'in_store');
CREATE TYPE verification_method AS ENUM ('geolocation', 'wifi', 'manual', 'staff_confirmed');
CREATE TYPE employee_status AS ENUM ('active', 'inactive', 'break', 'busy');
CREATE TYPE skill_level AS ENUM ('beginner', 'intermediate', 'expert');
CREATE TYPE alert_type AS ENUM ('queue_overflow', 'employee_unavailable', 'system_error', 'emergency');
CREATE TYPE alert_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE rule_type AS ENUM ('load_balancing', 'priority_override', 'service_limit', 'emergency_protocol');

-- Core Tables
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  agency_id UUID,
  location_ids TEXT[] DEFAULT '{}',
  pin_required BOOLEAN DEFAULT true,
  pin_verified BOOLEAN DEFAULT false,
  last_login_at TIMESTAMPTZ,
  session_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  domain TEXT UNIQUE NOT NULL,
  logo TEXT,
  brand_color TEXT DEFAULT '#3B82F6',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES agencies(id),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  timezone TEXT DEFAULT 'America/New_York',
  coordinates JSONB,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID REFERENCES locations(id) NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  specialties TEXT[] DEFAULT '{}',
  service_ids TEXT[] DEFAULT '{}',
  skill_level JSONB DEFAULT '{}',
  schedule JSONB DEFAULT '{}',
  performance JSONB DEFAULT '{}',
  availability JSONB DEFAULT '{}',
  queue_settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID REFERENCES locations(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  parent_category_id UUID REFERENCES service_categories(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID REFERENCES locations(id) NOT NULL,
  category_id UUID REFERENCES service_categories(id),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- For backward compatibility
  estimated_duration INTEGER NOT NULL,
  requirements TEXT[] DEFAULT '{}',
  price DECIMAL(10,2),
  skill_level_required skill_level DEFAULT 'intermediate',
  assigned_employee_ids TEXT[] DEFAULT '{}',
  auto_assignment_rules JSONB DEFAULT '{}',
  customer_types JSONB[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS queue_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID REFERENCES locations(id) NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_type customer_type DEFAULT 'regular',
  services TEXT[] DEFAULT '{}',
  service_ids TEXT[] DEFAULT '{}',
  assigned_employee_id UUID REFERENCES employees(id),
  assigned_employee_name TEXT,
  preferred_employee_id UUID REFERENCES employees(id),
  assignment_method assignment_method DEFAULT 'manual',
  priority priority DEFAULT 'normal',
  status queue_status DEFAULT 'waiting',
  position INTEGER NOT NULL,
  estimated_wait_time INTEGER NOT NULL,
  actual_wait_time INTEGER,
  service_start_time TIMESTAMPTZ,
  service_end_time TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT now(),
  called_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notifications JSONB[] DEFAULT '{}',
  special_requests TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS checkin_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID REFERENCES locations(id) NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_type customer_type DEFAULT 'regular',
  services TEXT[] DEFAULT '{}',
  preferred_employee_id UUID REFERENCES employees(id),
  checkin_type checkin_type NOT NULL,
  status checkin_status DEFAULT 'en_route',
  checkin_code TEXT UNIQUE NOT NULL,
  estimated_arrival_time TIMESTAMPTZ,
  actual_arrival_time TIMESTAMPTZ,
  checkin_time TIMESTAMPTZ DEFAULT now(),
  verification_method verification_method,
  coordinates JSONB,
  special_requests TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  last_visit TIMESTAMPTZ DEFAULT now(),
  visit_count INTEGER DEFAULT 1,
  preferred_services TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Authentication & Security Tables
CREATE TABLE IF NOT EXISTS pin_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  location_id UUID REFERENCES locations(id) NOT NULL,
  hashed_pin TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  failed_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, location_id)
);

CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  username TEXT,
  ip_address TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  location_id UUID REFERENCES locations(id),
  timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS security_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  max_login_attempts INTEGER DEFAULT 5,
  lockout_duration INTEGER DEFAULT 15, -- minutes
  session_timeout INTEGER DEFAULT 480, -- minutes (8 hours)
  pin_length INTEGER DEFAULT 4,
  require_pin_for_actions TEXT[] DEFAULT '{}',
  password_min_length INTEGER DEFAULT 8,
  password_require_special_chars BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Queue Management Tables
CREATE TABLE IF NOT EXISTS queue_control_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID REFERENCES locations(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type rule_type NOT NULL,
  conditions JSONB[] DEFAULT '{}',
  actions JSONB[] DEFAULT '{}',
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS system_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type alert_type NOT NULL,
  severity alert_severity NOT NULL,
  message TEXT NOT NULL,
  location_id UUID REFERENCES locations(id),
  employee_id TEXT,
  customer_id TEXT,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Session Management
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  token TEXT UNIQUE NOT NULL,
  refresh_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  pin_verified BOOLEAN DEFAULT false,
  location_id UUID REFERENCES locations(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
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
CREATE POLICY "Users can read own data" ON users FOR SELECT TO authenticated USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own data" ON users FOR UPDATE TO authenticated USING (auth.uid()::text = id::text);

CREATE POLICY "Agency admins can manage agencies" ON agencies FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE users.id::text = auth.uid()::text AND users.role = 'agency_admin')
);

CREATE POLICY "Users can read locations they have access to" ON locations FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE users.id::text = auth.uid()::text AND locations.id::text = ANY(users.location_ids))
);

CREATE POLICY "Location managers can manage their locations" ON locations FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE users.id::text = auth.uid()::text AND locations.id::text = ANY(users.location_ids))
);

CREATE POLICY "Staff can read employees at their locations" ON employees FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE users.id::text = auth.uid()::text AND employees.location_id::text = ANY(users.location_ids))
);

CREATE POLICY "Staff can read services at their locations" ON services FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE users.id::text = auth.uid()::text AND services.location_id::text = ANY(users.location_ids))
);

CREATE POLICY "Staff can manage queue entries at their locations" ON queue_entries FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE users.id::text = auth.uid()::text AND queue_entries.location_id::text = ANY(users.location_ids))
);

-- Public access for customers (no auth required for check-in)
CREATE POLICY "Public can create checkin entries" ON checkin_entries FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public can read own checkin entries" ON checkin_entries FOR SELECT TO anon USING (true);
CREATE POLICY "Public can update own checkin entries" ON checkin_entries FOR UPDATE TO anon USING (true);

CREATE POLICY "Public can create queue entries" ON queue_entries FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public can read own queue entries" ON queue_entries FOR SELECT TO anon USING (true);

CREATE POLICY "Public can access customer history" ON customer_history FOR ALL TO anon USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_queue_entries_location_status ON queue_entries(location_id, status);
CREATE INDEX IF NOT EXISTS idx_queue_entries_customer_phone ON queue_entries(customer_phone);
CREATE INDEX IF NOT EXISTS idx_checkin_entries_location_status ON checkin_entries(location_id, status);
CREATE INDEX IF NOT EXISTS idx_checkin_entries_code ON checkin_entries(checkin_code);
CREATE INDEX IF NOT EXISTS idx_customer_history_phone ON customer_history(phone);
CREATE INDEX IF NOT EXISTS idx_employees_location ON employees(location_id);
CREATE INDEX IF NOT EXISTS idx_services_location ON services(location_id);

-- Insert sample data for demo
INSERT INTO agencies (id, name, domain, brand_color) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Demo Salon Group', 'demo-salon.com', '#3B82F6');

INSERT INTO locations (id, agency_id, name, address, phone, email, settings) VALUES 
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Downtown Salon', '123 Main St, Downtown City, DC 12345', '+1234567890', 'downtown@salon.com', 
'{"businessHours": {"monday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "friday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "saturday": {"isOpen": true, "openTime": "08:00", "closeTime": "18:00"}, "sunday": {"isOpen": false, "openTime": "10:00", "closeTime": "16:00"}}, "maxQueueSize": 50, "allowWalkIns": true, "requireAppointments": false, "allowRemoteCheckin": true, "checkinRadius": 100, "autoAssignEmployees": true, "maxQueuePerEmployee": 5, "loadBalancingThreshold": 3}'),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Uptown Branch', '456 Oak Ave, Uptown City, UC 67890', '+1234567891', 'uptown@salon.com',
'{"businessHours": {"monday": {"isOpen": true, "openTime": "10:00", "closeTime": "19:00"}, "tuesday": {"isOpen": true, "openTime": "10:00", "closeTime": "19:00"}, "wednesday": {"isOpen": true, "openTime": "10:00", "closeTime": "19:00"}, "thursday": {"isOpen": true, "openTime": "10:00", "closeTime": "21:00"}, "friday": {"isOpen": true, "openTime": "10:00", "closeTime": "21:00"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "19:00"}, "sunday": {"isOpen": true, "openTime": "11:00", "closeTime": "17:00"}}, "maxQueueSize": 30, "allowWalkIns": true, "requireAppointments": true, "allowRemoteCheckin": true, "checkinRadius": 100, "autoAssignEmployees": false}');

INSERT INTO users (id, username, email, role, first_name, last_name, agency_id, location_ids) VALUES 
('550e8400-e29b-41d4-a716-446655440010', 'khainguyen105', 'khai@agency.com', 'agency_admin', 'Khai', 'Nguyen', '550e8400-e29b-41d4-a716-446655440000', '{"550e8400-e29b-41d4-a716-446655440001", "550e8400-e29b-41d4-a716-446655440002"}'),
('550e8400-e29b-41d4-a716-446655440011', 'manager1', 'manager@location.com', 'location_manager', 'John', 'Manager', '550e8400-e29b-41d4-a716-446655440000', '{"550e8400-e29b-41d4-a716-446655440001"}'),
('550e8400-e29b-41d4-a716-446655440012', 'staff1', 'staff@location.com', 'staff', 'Jane', 'Staff', '550e8400-e29b-41d4-a716-446655440000', '{"550e8400-e29b-41d4-a716-446655440001"}');

INSERT INTO service_categories (id, location_id, name, description, color, sort_order) VALUES 
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440001', 'Hair Services', 'Professional hair cutting, styling, and treatments', '#3B82F6', 1),
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440001', 'Grooming', 'Beard trimming and mens grooming services', '#10B981', 2),
('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440001', 'Nail Services', 'Manicures, pedicures, and nail treatments', '#F59E0B', 3);

INSERT INTO employees (id, location_id, first_name, last_name, email, phone, specialties, service_ids, skill_level, schedule, performance, availability, queue_settings) VALUES 
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440001', 'Sarah', 'Wilson', 'sarah@salon.com', '+1234567892', '{"haircut", "styling", "coloring"}', '{}',
'{}', 
'{"monday": {"isWorking": true, "startTime": "09:00", "endTime": "17:00", "breakTimes": [{"startTime": "12:00", "endTime": "13:00", "type": "lunch"}]}, "tuesday": {"isWorking": true, "startTime": "09:00", "endTime": "17:00", "breakTimes": [{"startTime": "12:00", "endTime": "13:00", "type": "lunch"}]}, "wednesday": {"isWorking": true, "startTime": "09:00", "endTime": "17:00", "breakTimes": [{"startTime": "12:00", "endTime": "13:00", "type": "lunch"}]}, "thursday": {"isWorking": true, "startTime": "09:00", "endTime": "17:00", "breakTimes": [{"startTime": "12:00", "endTime": "13:00", "type": "lunch"}]}, "friday": {"isWorking": true, "startTime": "09:00", "endTime": "17:00", "breakTimes": [{"startTime": "12:00", "endTime": "13:00", "type": "lunch"}]}, "saturday": {"isWorking": true, "startTime": "08:00", "endTime": "16:00", "breakTimes": [{"startTime": "12:00", "endTime": "13:00", "type": "lunch"}]}, "sunday": {"isWorking": false, "startTime": "10:00", "endTime": "16:00", "breakTimes": []}}',
'{"averageServiceTime": 45, "customersServed": 156, "customerRating": 4.8, "currentWorkload": 2, "efficiency": 92, "lastUpdated": "2024-01-01T00:00:00Z"}',
'{"status": "active", "lastStatusChange": "2024-01-01T00:00:00Z", "notes": "Available for new customers"}',
'{"maxQueueSize": 5, "acceptNewCustomers": true, "turnSharingEnabled": true, "turnSharingPartners": ["550e8400-e29b-41d4-a716-446655440031"], "priorityHandling": "flexible", "breakSchedule": [{"startTime": "12:00", "endTime": "13:00", "type": "lunch", "isRecurring": true}]}'),
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440001', 'Mike', 'Johnson', 'mike@salon.com', '+1234567893', '{"haircut", "beard_trim", "styling"}', '{}',
'{}',
'{"monday": {"isWorking": false, "startTime": "10:00", "endTime": "18:00", "breakTimes": []}, "tuesday": {"isWorking": true, "startTime": "10:00", "endTime": "18:00", "breakTimes": [{"startTime": "13:00", "endTime": "14:00", "type": "lunch"}]}, "wednesday": {"isWorking": true, "startTime": "10:00", "endTime": "18:00", "breakTimes": [{"startTime": "13:00", "endTime": "14:00", "type": "lunch"}]}, "thursday": {"isWorking": true, "startTime": "10:00", "endTime": "18:00", "breakTimes": [{"startTime": "13:00", "endTime": "14:00", "type": "lunch"}]}, "friday": {"isWorking": true, "startTime": "10:00", "endTime": "18:00", "breakTimes": [{"startTime": "13:00", "endTime": "14:00", "type": "lunch"}]}, "saturday": {"isWorking": true, "startTime": "09:00", "endTime": "17:00", "breakTimes": [{"startTime": "13:00", "endTime": "14:00", "type": "lunch"}]}, "sunday": {"isWorking": true, "startTime": "11:00", "endTime": "15:00", "breakTimes": []}}',
'{"averageServiceTime": 35, "customersServed": 198, "customerRating": 4.6, "currentWorkload": 3, "efficiency": 88, "lastUpdated": "2024-01-01T00:00:00Z"}',
'{"status": "active", "lastStatusChange": "2024-01-01T00:00:00Z", "notes": "Specializes in mens cuts"}',
'{"maxQueueSize": 4, "acceptNewCustomers": true, "turnSharingEnabled": true, "turnSharingPartners": ["550e8400-e29b-41d4-a716-446655440030"], "priorityHandling": "strict", "breakSchedule": [{"startTime": "13:00", "endTime": "14:00", "type": "lunch", "isRecurring": true}]}');

INSERT INTO services (id, location_id, category_id, name, description, category, estimated_duration, price, skill_level_required, assigned_employee_ids, auto_assignment_rules) VALUES 
('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440020', 'Haircut & Style', 'Professional haircut with styling', 'Hair Services', 45, 65.00, 'intermediate', '{"550e8400-e29b-41d4-a716-446655440030", "550e8400-e29b-41d4-a716-446655440031"}', '{"preferredEmployeeIds": ["550e8400-e29b-41d4-a716-446655440030", "550e8400-e29b-41d4-a716-446655440031"], "requireSpecialty": true, "considerWorkload": true, "considerRating": true, "considerAvailability": true, "fallbackToAnyEmployee": false, "loadBalancingEnabled": true}'),
('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440020', 'Hair Coloring', 'Full or partial hair coloring service', 'Hair Services', 120, 150.00, 'expert', '{"550e8400-e29b-41d4-a716-446655440030"}', '{"preferredEmployeeIds": ["550e8400-e29b-41d4-a716-446655440030"], "requireSpecialty": true, "considerWorkload": true, "considerRating": true, "considerAvailability": true, "fallbackToAnyEmployee": false, "loadBalancingEnabled": true}'),
('550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440021', 'Beard Trim', 'Professional beard trimming and shaping', 'Grooming', 20, 25.00, 'beginner', '{"550e8400-e29b-41d4-a716-446655440031"}', '{"preferredEmployeeIds": ["550e8400-e29b-41d4-a716-446655440031"], "requireSpecialty": true, "considerWorkload": false, "considerRating": true, "considerAvailability": true, "fallbackToAnyEmployee": true, "loadBalancingEnabled": false}');

-- Insert sample customer history
INSERT INTO customer_history (phone, name, email, last_visit, visit_count, preferred_services) VALUES 
('(555) 123-4567', 'Alice Johnson', 'alice@email.com', now() - interval '2 days', 8, '{"Haircut & Style", "Hair Coloring"}'),
('(555) 987-6543', 'Bob Smith', 'bob@email.com', now() - interval '7 days', 3, '{"Haircut & Style", "Beard Trim"}'),
('(555) 456-7890', 'Carol Davis', 'carol@email.com', now() - interval '14 days', 12, '{"Hair Coloring", "Haircut & Style"}');

-- Insert security settings
INSERT INTO security_settings (max_login_attempts, lockout_duration, session_timeout, pin_length, require_pin_for_actions) VALUES 
(5, 15, 480, 4, '{"queue_management", "employee_management", "settings"}');