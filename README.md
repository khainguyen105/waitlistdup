# Comprehensive Waitlist Management System

A modern, real-time queue management system built with React, TypeScript, Supabase, and Cloudflare Workers.

## Features

### 🎯 Core Queue Management
- **Real-time Queue Updates**: Live position tracking and status updates
- **Multi-location Support**: Manage multiple business locations
- **Employee Assignment**: Automatic and manual staff assignment
- **Service Categories**: Organized service offerings with pricing
- **Priority Handling**: VIP, urgent, and emergency queue priorities

### 📱 Customer Experience
- **Remote Check-in**: Pre-arrival queue joining with estimated arrival times
- **In-store Check-in**: Location-verified immediate queue entry
- **QR Code Access**: Quick location-specific check-in via QR codes
- **SMS Notifications**: Real-time queue status updates (ready for integration)
- **Customer History**: Automatic preference tracking and VIP recognition

### 👥 Staff Dashboard
- **Employee Availability**: Real-time staff status and queue management
- **Queue Control Panel**: Automated rules and load balancing
- **Customer Database**: Comprehensive customer history and preferences
- **Service Management**: Dynamic service offerings and employee assignments
- **Analytics Dashboard**: Queue efficiency and performance metrics

### 🔒 Security & Administration
- **Role-based Access**: Agency admin, location manager, and staff roles
- **PIN Authentication**: Secure action verification
- **Audit Logging**: Complete security and access tracking
- **Multi-agency Support**: White-label solution for multiple organizations

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for responsive design
- **Zustand** for state management
- **React Router** for navigation
- **Lucide React** for icons

### Backend
- **Supabase** for database and real-time subscriptions
- **Supabase Edge Functions** for serverless API
- **PostgreSQL** with Row Level Security (RLS)
- **Real-time subscriptions** for live updates

### Infrastructure
- **Cloudflare Workers** for additional API endpoints
- **Netlify** for frontend deployment
- **QR Code generation** for customer access

## Quick Start

### 1. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Click the "Connect to Supabase" button in the app (top right)
3. Run the provided SQL migration to set up the database schema
4. The database will be automatically populated with sample data

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Deploy edge functions (optional)
supabase functions deploy
```

### 4. Demo Access

**Staff Login Credentials:**
- Agency Admin: `khainguyen105` / `khai123`
- Location Manager: `manager1` / `manager1`
- Staff: `staff1` / `staff1`
- Default PIN: `1234`

**Customer Access:**
- Visit any location's QR code URL or `/checkin`
- No login required for customers

## Database Schema

The system includes these main tables:

- **Users & Authentication**: `users`, `pin_codes`, `login_attempts`, `sessions`
- **Business Structure**: `agencies`, `locations`, `employees`, `services`, `service_categories`
- **Queue Management**: `queue_entries`, `checkin_entries`, `customer_history`
- **System Control**: `queue_control_rules`, `system_alerts`, `security_settings`

All tables include Row Level Security (RLS) policies for data protection.

## API Endpoints

### Staff API (`/functions/v1/queue-management`)
- `GET /queue` - Fetch queue entries
- `POST /queue/add` - Add customer to queue
- `PUT /queue/update` - Update queue entry status
- `GET /employees` - Get employees for location
- `GET /services` - Get services for location
- `GET /stats` - Get queue statistics

### Customer API (`/functions/v1/customer-checkin`)
- `GET /locations` - Public location list
- `GET /location` - Location details
- `POST /checkin` - Create check-in entry
- `POST /queue/join` - Join queue directly
- `GET /queue/status` - Check queue position

## Key Features

### Real-time Updates
The system uses Supabase's real-time subscriptions to provide live updates:
- Queue position changes
- Status updates (called, in progress, completed)
- Employee availability changes
- New customer arrivals

### Auto-assignment Algorithm
Intelligent employee assignment based on:
- Service specialties and skill levels
- Current workload and availability
- Customer ratings and preferences
- Queue balancing rules

### Security Features
- PIN-based action verification
- Role-based access control
- Audit logging for all actions
- Rate limiting and account lockout
- Secure customer data handling

### Mobile-first Design
- Touch-friendly interface
- Swipe gestures for queue management
- Responsive design for all devices
- Progressive Web App (PWA) ready

## Deployment

### Frontend (Netlify)
The app is configured for automatic Netlify deployment with proper redirects for SPA routing.

### Backend (Supabase)
Edge functions are automatically deployed to Supabase and handle all server-side logic.

### Environment Setup
1. Set up your Supabase project
2. Configure environment variables
3. Run database migrations
4. Deploy edge functions
5. Update frontend environment variables

## Development Roadmap

### Phase 1 (Current)
- ✅ Core queue management
- ✅ Customer check-in system
- ✅ Staff dashboard
- ✅ Real-time updates
- ✅ Security and authentication

### Phase 2 (Planned)
- 📅 Appointment scheduling
- 📧 Email/SMS notifications
- 📊 Advanced analytics
- 🎨 Custom branding
- 🔌 Third-party integrations

### Phase 3 (Future)
- 📱 Mobile applications
- 🤖 AI-powered optimization
- 📈 Predictive analytics
- 🌐 Multi-language support
- 🔄 Advanced automation

## Contributing

This is a comprehensive demonstration of modern web application architecture. The codebase includes:

- Clean component architecture
- Type-safe database operations
- Real-time data synchronization
- Security best practices
- Mobile-responsive design
- Production-ready deployment

## License

This project is a demo application showcasing modern web development practices with React, TypeScript, and Supabase.