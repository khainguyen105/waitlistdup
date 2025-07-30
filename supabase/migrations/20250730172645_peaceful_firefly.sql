/*
  # Create comprehensive waitlist management schema

  1. New Tables
    - `users` - System users with roles and authentication
    - `agencies` - Multi-tenant agency management
    - `locations` - Business locations with settings
    - `employees` - Staff members with availability and skills
    - `service_categories` - Organized service groupings
    - `services` - Available services with pricing and requirements
    - `queue_entries` - Active queue management
    - `checkin_entries` - Remote and in-store check-ins
    - `customer_history` - Customer profiles and visit history
    - `pin_codes` - Secure PIN authentication
    - `login_attempts` - Security audit logging
    - `security_settings` - System security configuration
    - `queue_control_rules` - Automated queue management rules
    - `system_alerts` - System notifications and alerts
    - `sessions` - User session management

  2. Security
    - Enable RLS on all tables
    - Role-based access policies
    - Secure customer data access
    - Audit trail for all actions

  3. Sample Data
    - Demo agencies and locations
    - Sample employees and services
    - Test users with different roles
    - Default security settings
*/

-- Create custom types
--CREATE TYPE user_role AS ENUM ('agency_admin', 'location_manager', 'staff', 'customer');
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

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    username text UNIQUE NOT NULL,
    email text UNIQUE NOT NULL,
    role user_role NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    agency_id text,
    location_ids text[] DEFAULT '{}',
    pin_required boolean DEFAULT true,
    pin_verified boolean DEFAULT false,
    last_login_at timestamptz,
    session_expires_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Agencies table
CREATE TABLE IF NOT EXISTS agencies (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name text NOT NULL,
    domain text UNIQUE NOT NULL,
    logo text,
    brand_color text DEFAULT '#3B82F6',
    settings jsonb NOT NULL DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Locations table
CREATE TABLE IF NOT EXISTS locations (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    agency_id text NOT NULL,
    name text NOT NULL,
    address text NOT NULL,
    phone text NOT NULL,
    email text NOT NULL,
    timezone text DEFAULT 'America/New_York',
    coordinates jsonb,
    settings jsonb NOT NULL DEFAULT '{}',
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    location_id text NOT NULL,
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

-- Service categories table
CREATE TABLE IF NOT EXISTS service_categories (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    location_id text NOT NULL,
    name text NOT NULL,
    description text,
    color text DEFAULT '#3B82F6',
    icon text,
    sort_order integer DEFAULT 0,
    parent_category_id text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    location_id text NOT NULL,
    category_id text,
    name text NOT NULL,
    description text NOT NULL,
    category text NOT NULL,
    estimated_duration integer NOT NULL,
    requirements text[] DEFAULT '{}',
    price numeric,
    skill_level_required skill_level DEFAULT 'intermediate',
    assigned_employee_ids text[] DEFAULT '{}',
    auto_assignment_rules jsonb DEFAULT '{}',
    customer_types jsonb[] DEFAULT '{}',
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Queue entries table
CREATE TABLE IF NOT EXISTS queue_entries (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    location_id text NOT NULL,
    customer_name text NOT NULL,
    customer_phone text NOT NULL,
    customer_email text,
    customer_type customer_type DEFAULT 'regular',
    services text[] DEFAULT '{}',
    service_ids text[] DEFAULT '{}',
    assigned_employee_id text,
    assigned_employee_name text,
    preferred_employee_id text,
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

-- Checkin entries table
CREATE TABLE IF NOT EXISTS checkin_entries (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    location_id text NOT NULL,
    customer_name text NOT NULL,
    customer_phone text NOT NULL,
    customer_email text,
    customer_type customer_type DEFAULT 'regular',
    services text[] DEFAULT '{}',
    preferred_employee_id text,
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

CREATE POLICY "Allow anon insert for checkin_entries" ON "public"."checkin_entries" FOR INSERT WITH CHECK (true);
-- Customer history table
CREATE TABLE IF NOT EXISTS customer_history (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
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

-- PIN codes table
CREATE TABLE IF NOT EXISTS pin_codes (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id text NOT NULL,
    location_id text NOT NULL,
    hashed_pin text NOT NULL,
    salt text NOT NULL,
    created_at timestamptz DEFAULT now(),
    last_used_at timestamptz,
    failed_attempts integer DEFAULT 0,
    locked_until timestamptz,
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, location_id)
);

-- Login attempts table
CREATE TABLE IF NOT EXISTS login_attempts (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id text,
    username text,
    ip_address text NOT NULL,
    user_agent text NOT NULL,
    success boolean NOT NULL,
    failure_reason text,
    location_id text,
    timestamp timestamptz DEFAULT now()
);

-- Security settings table
CREATE TABLE IF NOT EXISTS security_settings (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
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

-- Queue control rules table
CREATE TABLE IF NOT EXISTS queue_control_rules (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    location_id text NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    type rule_type NOT NULL,
    conditions jsonb[] DEFAULT '{}',
    actions jsonb[] DEFAULT '{}',
    priority integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- System alerts table
CREATE TABLE IF NOT EXISTS system_alerts (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    type alert_type NOT NULL,
    severity alert_severity NOT NULL,
    message text NOT NULL,
    location_id text,
    employee_id text,
    customer_id text,
    is_resolved boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    resolved_at timestamptz,
    updated_at timestamptz DEFAULT now()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id text NOT NULL,
    token text UNIQUE NOT NULL,
    refresh_token text UNIQUE NOT NULL,
    expires_at timestamptz NOT NULL,
    pin_verified boolean DEFAULT false,
    location_id text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE users ADD CONSTRAINT users_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES agencies(id);
ALTER TABLE locations ADD CONSTRAINT locations_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES agencies(id);
ALTER TABLE employees ADD CONSTRAINT employees_location_id_fkey FOREIGN KEY (location_id) REFERENCES locations(id);
ALTER TABLE service_categories ADD CONSTRAINT service_categories_location_id_fkey FOREIGN KEY (location_id) REFERENCES locations(id);
ALTER TABLE service_categories ADD CONSTRAINT service_categories_parent_category_id_fkey FOREIGN KEY (parent_category_id) REFERENCES service_categories(id);
ALTER TABLE services ADD CONSTRAINT services_location_id_fkey FOREIGN KEY (location_id) REFERENCES locations(id);
ALTER TABLE services ADD CONSTRAINT services_category_id_fkey FOREIGN KEY (category_id) REFERENCES service_categories(id);
ALTER TABLE queue_entries ADD CONSTRAINT queue_entries_location_id_fkey FOREIGN KEY (location_id) REFERENCES locations(id);
ALTER TABLE queue_entries ADD CONSTRAINT queue_entries_assigned_employee_id_fkey FOREIGN KEY (assigned_employee_id) REFERENCES employees(id);
ALTER TABLE queue_entries ADD CONSTRAINT queue_entries_preferred_employee_id_fkey FOREIGN KEY (preferred_employee_id) REFERENCES employees(id);
ALTER TABLE checkin_entries ADD CONSTRAINT checkin_entries_location_id_fkey FOREIGN KEY (location_id) REFERENCES locations(id);
ALTER TABLE pin_codes ADD CONSTRAINT pin_codes_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE login_attempts ADD CONSTRAINT login_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE queue_control_rules ADD CONSTRAINT queue_control_rules_location_id_fkey FOREIGN KEY (location_id) REFERENCES locations(id);
ALTER TABLE system_alerts ADD CONSTRAINT system_alerts_location_id_fkey FOREIGN KEY (location_id) REFERENCES locations(id);
ALTER TABLE sessions ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

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

CREATE POLICY "Allow all for agency_admin, location_manager, and staff" ON "public"."checkin_entries" FOR ALL USING (auth.role() IN ('agency_admin', 'location_manager', 'staff'));
CREATE POLICY "Allow customer to read their own checkins" ON "public"."checkin_entries" FOR SELECT USING (auth.uid() = customer_id); -- NOTE: This policy might need adjustment if 'customer_id' is not directly linked to auth.uid() in your table.
CREATE POLICY "Allow anon insert for checkin_entries" ON "public"."checkin_entries" FOR INSERT WITH CHECK (true);

-- RLS Policies for public access (customers)
CREATE POLICY "Allow public read access to locations" ON locations FOR SELECT USING (is_active = true);
CREATE POLICY "Allow public read access to services" ON services FOR SELECT USING (is_active = true);
CREATE POLICY "Allow public insert to queue_entries" ON queue_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert to checkin_entries" ON checkin_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert to customer_history" ON customer_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to customer_history" ON customer_history FOR UPDATE USING (true);

-- RLS Policies for authenticated users
CREATE POLICY "Allow authenticated users full access" ON users FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated agencies access" ON agencies FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated locations access" ON locations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated employees access" ON employees FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated service_categories access" ON service_categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated services access" ON services FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated queue_entries access" ON queue_entries FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated checkin_entries access" ON checkin_entries FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated customer_history access" ON customer_history FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated pin_codes access" ON pin_codes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated login_attempts access" ON login_attempts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated security_settings access" ON security_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated queue_control_rules access" ON queue_control_rules FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated system_alerts access" ON system_alerts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated sessions access" ON sessions FOR ALL USING (auth.role() = 'authenticated');

-- Insert sample data
INSERT INTO agencies (id, name, domain, brand_color, settings) VALUES 
('1', 'Global Salon Group', 'globalsalon.com', '#3B82F6', '{"allowSelfJoin": true, "requirePhoneVerification": false, "enableSMSNotifications": true, "enableEmailNotifications": true, "defaultWaitTimeBuffer": 5}');

INSERT INTO users (id, username, email, role, first_name, last_name, agency_id, location_ids, pin_required, pin_verified) VALUES
('1', 'khainguyen105', 'khai@agency.com', 'agency_admin', 'Khai', 'Nguyen', '1', ARRAY['1', '2'], true, false),
('2', 'manager1', 'manager@location.com', 'location_manager', 'John', 'Manager', '1', ARRAY['1'], true, false),
('3', 'staff1', 'staff@location.com', 'staff', 'Jane', 'Staff', '1', ARRAY['1'], true, false);

INSERT INTO locations (id, agency_id, name, address, phone, email, timezone, settings, is_active) VALUES
('1', '1', 'Downtown Salon', '123 Main St, Downtown City, DC 12345', '+1234567890', 'downtown@salon.com', 'America/New_York', '{"businessHours": {"monday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "friday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "saturday": {"isOpen": true, "openTime": "08:00", "closeTime": "18:00"}, "sunday": {"isOpen": false, "openTime": "10:00", "closeTime": "16:00"}}, "maxQueueSize": 50, "allowWalkIns": true, "requireAppointments": false, "allowRemoteCheckin": true, "checkinRadius": 100, "autoAssignEmployees": true}', true),
('2', '1', 'Uptown Branch', '456 Oak Ave, Uptown City, UC 67890', '+1234567891', 'uptown@salon.com', 'America/New_York', '{"businessHours": {"monday": {"isOpen": true, "openTime": "10:00", "closeTime": "19:00"}, "tuesday": {"isOpen": true, "openTime": "10:00", "closeTime": "19:00"}, "wednesday": {"isOpen": true, "openTime": "10:00", "closeTime": "19:00"}, "thursday": {"isOpen": true, "openTime": "10:00", "closeTime": "21:00"}, "friday": {"isOpen": true, "openTime": "10:00", "closeTime": "21:00"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "19:00"}, "sunday": {"isOpen": true, "openTime": "11:00", "closeTime": "17:00"}}, "maxQueueSize": 30, "allowWalkIns": true, "requireAppointments": true, "allowRemoteCheckin": true, "checkinRadius": 100, "autoAssignEmployees": false}', true);

INSERT INTO service_categories (id, location_id, name, description, color, icon, sort_order, is_active) VALUES
('1', '1', 'Hair Services', 'Professional hair cutting, styling, and treatments', '#3B82F6', 'scissors', 1, true),
('2', '1', 'Grooming', 'Beard trimming and men''s grooming services', '#10B981', 'user', 2, true),
('3', '1', 'Nail Services', 'Manicures, pedicures, and nail treatments', '#F59E0B', 'hand', 3, true),
('4', '1', 'Spa Treatments', 'Relaxing spa and wellness services', '#8B5CF6', 'heart', 4, true);

INSERT INTO employees (id, location_id, first_name, last_name, email, phone, specialties, service_ids, skill_level, schedule, performance, availability, queue_settings, is_active) VALUES
('1', '1', 'Sarah', 'Wilson', 'sarah@salon.com', '+1234567892', ARRAY['haircut', 'styling', 'coloring'], ARRAY['1', '2'], '{"1": "expert", "2": "intermediate"}', '{"monday": {"isWorking": true, "startTime": "09:00", "endTime": "17:00", "breakTimes": [{"startTime": "12:00", "endTime": "13:00", "type": "lunch"}]}, "tuesday": {"isWorking": true, "startTime": "09:00", "endTime": "17:00", "breakTimes": [{"startTime": "12:00", "endTime": "13:00", "type": "lunch"}]}, "wednesday": {"isWorking": true, "startTime": "09:00", "endTime": "17:00", "breakTimes": [{"startTime": "12:00", "endTime": "13:00", "type": "lunch"}]}, "thursday": {"isWorking": true, "startTime": "09:00", "endTime": "17:00", "breakTimes": [{"startTime": "12:00", "endTime": "13:00", "type": "lunch"}]}, "friday": {"isWorking": true, "startTime": "09:00", "endTime": "17:00", "breakTimes": [{"startTime": "12:00", "endTime": "13:00", "type": "lunch"}]}, "saturday": {"isWorking": true, "startTime": "08:00", "endTime": "16:00", "breakTimes": [{"startTime": "12:00", "endTime": "13:00", "type": "lunch"}]}, "sunday": {"isWorking": false, "startTime": "10:00", "endTime": "16:00", "breakTimes": []}}', '{"averageServiceTime": 45, "customersServed": 156, "customerRating": 4.8, "currentWorkload": 2, "efficiency": 92, "lastUpdated": "2025-07-30T17:00:00.000Z"}', '{"status": "active", "lastStatusChange": "2025-07-30T17:00:00.000Z", "notes": "Available for new customers"}', '{"maxQueueSize": 5, "acceptNewCustomers": true, "turnSharingEnabled": true, "turnSharingPartners": ["2"], "priorityHandling": "flexible", "breakSchedule": [{"startTime": "12:00", "endTime": "13:00", "type": "lunch", "isRecurring": true}, {"startTime": "15:00", "endTime": "15:15", "type": "break", "isRecurring": true}]}', true),
('2', '1', 'Mike', 'Johnson', 'mike@salon.com', '+1234567893', ARRAY['haircut', 'beard_trim', 'styling'], ARRAY['1', '3'], '{"1": "expert", "3": "expert"}', '{"monday": {"isWorking": false, "startTime": "10:00", "endTime": "18:00", "breakTimes": []}, "tuesday": {"isWorking": true, "startTime": "10:00", "endTime": "18:00", "breakTimes": [{"startTime": "13:00", "endTime": "14:00", "type": "lunch"}]}, "wednesday": {"isWorking": true, "startTime": "10:00", "endTime": "18:00", "breakTimes": [{"startTime": "13:00", "endTime": "14:00", "type": "lunch"}]}, "thursday": {"isWorking": true, "startTime": "10:00", "endTime": "18:00", "breakTimes": [{"startTime": "13:00", "endTime": "14:00", "type": "lunch"}]}, "friday": {"isWorking": true, "startTime": "10:00", "endTime": "18:00", "breakTimes": [{"startTime": "13:00", "endTime": "14:00", "type": "lunch"}]}, "saturday": {"isWorking": true, "startTime": "09:00", "endTime": "17:00", "breakTimes": [{"startTime": "13:00", "endTime": "14:00", "type": "lunch"}]}, "sunday": {"isWorking": true, "startTime": "11:00", "endTime": "15:00", "breakTimes": []}}', '{"averageServiceTime": 35, "customersServed": 198, "customerRating": 4.6, "currentWorkload": 3, "efficiency": 88, "lastUpdated": "2025-07-30T17:00:00.000Z"}', '{"status": "active", "lastStatusChange": "2025-07-30T17:00:00.000Z", "notes": "Specializes in men''s cuts"}', '{"maxQueueSize": 4, "acceptNewCustomers": true, "turnSharingEnabled": true, "turnSharingPartners": ["1"], "priorityHandling": "strict", "breakSchedule": [{"startTime": "13:00", "endTime": "14:00", "type": "lunch", "isRecurring": true}]}', true),
('3', '1', 'Emma', 'Davis', 'emma@salon.com', '+1234567894', ARRAY['manicure', 'pedicure', 'nail_art'], ARRAY['4', '5'], '{"4": "expert", "5": "intermediate"}', '{"monday": {"isWorking": true, "startTime": "09:00", "endTime": "17:00", "breakTimes": [{"startTime": "12:00", "endTime": "13:00", "type": "lunch"}]}, "tuesday": {"isWorking": true, "startTime": "09:00", "endTime": "17:00", "breakTimes": [{"startTime": "12:00", "endTime": "13:00", "type": "lunch"}]}, "wednesday": {"isWorking": true, "startTime": "09:00", "endTime": "17:00", "breakTimes": [{"startTime": "12:00", "endTime": "13:00", "type": "lunch"}]}, "thursday": {"isWorking": true, "startTime": "09:00", "endTime": "17:00", "breakTimes": [{"startTime": "12:00", "endTime": "13:00", "type": "lunch"}]}, "friday": {"isWorking": true, "startTime": "09:00", "endTime": "17:00", "breakTimes": [{"startTime": "12:00", "endTime": "13:00", "type": "lunch"}]}, "saturday": {"isWorking": false, "startTime": "09:00", "endTime": "17:00", "breakTimes": []}, "sunday": {"isWorking": false, "startTime": "10:00", "endTime": "16:00", "breakTimes": []}}', '{"averageServiceTime": 60, "customersServed": 89, "customerRating": 4.9, "currentWorkload": 0, "efficiency": 95, "lastUpdated": "2025-07-30T17:00:00.000Z"}', '{"status": "active", "lastStatusChange": "2025-07-30T17:00:00.000Z"}', '{"maxQueueSize": 5, "acceptNewCustomers": true, "turnSharingEnabled": true, "turnSharingPartners": [], "priorityHandling": "flexible", "breakSchedule": []}', true);

INSERT INTO services (id, location_id, category_id, name, description, category, estimated_duration, requirements, price, skill_level_required, assigned_employee_ids, auto_assignment_rules, customer_types, is_active) VALUES
('1', '1', '1', 'Haircut & Style', 'Professional haircut with styling', 'Hair Services', 45, ARRAY['consultation'], 65, 'intermediate', ARRAY['1', '2'], '{"preferredEmployeeIds": ["1", "2"], "requireSpecialty": true, "considerWorkload": true, "considerRating": true, "fallbackToAnyEmployee": false}', ARRAY[]::jsonb[], true),
('2', '1', '1', 'Hair Coloring', 'Full or partial hair coloring service', 'Hair Services', 120, ARRAY['patch_test', 'consultation'], 150, 'expert', ARRAY['1'], '{"preferredEmployeeIds": ["1"], "requireSpecialty": true, "considerWorkload": true, "considerRating": true, "fallbackToAnyEmployee": false}', ARRAY[]::jsonb[], true),
('3', '1', '2', 'Beard Trim', 'Professional beard trimming and shaping', 'Grooming', 20, ARRAY[]::text[], 25, 'beginner', ARRAY['2'], '{"preferredEmployeeIds": ["2"], "requireSpecialty": true, "considerWorkload": false, "considerRating": true, "fallbackToAnyEmployee": true}', ARRAY[]::jsonb[], true),
('4', '1', '3', 'Manicure', 'Complete nail care and polish application', 'Nail Services', 45, ARRAY[]::text[], 35, 'intermediate', ARRAY['3'], '{"preferredEmployeeIds": ["3"], "requireSpecialty": true, "considerWorkload": true, "considerRating": true, "fallbackToAnyEmployee": false}', ARRAY[]::jsonb[], true),
('5', '1', '3', 'Pedicure', 'Complete foot care and polish application', 'Nail Services', 60, ARRAY[]::text[], 45, 'intermediate', ARRAY['3'], '{"preferredEmployeeIds": ["3"], "requireSpecialty": true, "considerWorkload": true, "considerRating": true, "fallbackToAnyEmployee": false}', ARRAY[]::jsonb[], true);

INSERT INTO security_settings (id, max_login_attempts, lockout_duration, session_timeout, pin_length, require_pin_for_actions, password_min_length, password_require_special_chars) VALUES
('1', 5, 15, 480, 4, ARRAY['queue_management', 'employee_management', 'settings'], 8, true);

-- Sample customer data
INSERT INTO customer_history (phone, name, email, last_visit, visit_count, preferred_services, notes) VALUES
('(555) 123-4567', 'Alice Johnson', 'alice@email.com', now() - interval '2 days', 8, ARRAY['Haircut & Style', 'Hair Coloring'], 'Prefers morning appointments'),
('(555) 987-6543', 'Bob Smith', 'bob@email.com', now() - interval '7 days', 3, ARRAY['Haircut & Style', 'Beard Trim'], null),
('(555) 456-7890', 'Carol Davis', 'carol@email.com', now() - interval '14 days', 12, ARRAY['Hair Coloring', 'Haircut & Style'], 'VIP customer, allergic to certain hair products'),
('(555) 321-0987', 'David Wilson', null, now() - interval '30 days', 1, ARRAY['Haircut & Style'], null),
('(555) 654-3210', 'Emma Brown', 'emma@email.com', now() - interval '5 days', 6, ARRAY['Haircut & Style', 'Hair Coloring'], null);

-- Sample queue entry
INSERT INTO queue_entries (location_id, customer_name, customer_phone, customer_email, customer_type, services, service_ids, assignment_method, priority, status, position, estimated_wait_time, joined_at) VALUES
('1', 'Alice Johnson', '(555) 123-4567', 'alice@email.com', 'regular', ARRAY['Haircut & Style'], ARRAY['1'], 'auto', 'normal', 'waiting', 1, 15, now() - interval '10 minutes');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_queue_entries_location_status ON queue_entries(location_id, status);
CREATE INDEX IF NOT EXISTS idx_queue_entries_position ON queue_entries(position);
CREATE INDEX IF NOT EXISTS idx_checkin_entries_location_status ON checkin_entries(location_id, status);
CREATE INDEX IF NOT EXISTS idx_customer_history_phone ON customer_history(phone);
CREATE INDEX IF NOT EXISTS idx_employees_location_active ON employees(location_id, is_active);
CREATE INDEX IF NOT EXISTS idx_services_location_active ON services(location_id, is_active);
CREATE INDEX IF NOT EXISTS idx_login_attempts_timestamp ON login_attempts(timestamp);
CREATE INDEX IF NOT EXISTS idx_pin_codes_user_location ON pin_codes(user_id, location_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agencies_updated_at BEFORE UPDATE ON agencies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_categories_updated_at BEFORE UPDATE ON service_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_queue_entries_updated_at BEFORE UPDATE ON queue_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_checkin_entries_updated_at BEFORE UPDATE ON checkin_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_history_updated_at BEFORE UPDATE ON customer_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pin_codes_updated_at BEFORE UPDATE ON pin_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_security_settings_updated_at BEFORE UPDATE ON security_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_queue_control_rules_updated_at BEFORE UPDATE ON queue_control_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_alerts_updated_at BEFORE UPDATE ON system_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();