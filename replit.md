# Lifestyle Products Call Center Application

## Overview

This is a full-stack web application designed for a call center to sign up clients for lifestyle products. The system provides a public landing page for lead generation, an agent dashboard for managing customers and signups, and an admin dashboard for tracking overall performance and statistics.

**Current Status**: Fully operational with PostgreSQL database, sample products, and test users.

## Login Credentials
- **Admin**: admin@lifestylepro.co.za / password
- **Agent 1**: agent1@lifestylepro.co.za / password  
- **Agent 2**: agent2@lifestylepro.co.za / password

## Recent Changes (August 01, 2025)
- ✓ Successfully migrated from Replit Agent to standard Replit environment
- ✓ Connected to user's Neon PostgreSQL database
- ✓ Fixed TypeScript errors in storage layer
- ✓ Database seeded with 5 lifestyle products (OPPORTUNITY, MOMENTUM, PROSPER, PRESTIGE, PINNACLE)
- ✓ Created 3 test users with proper authentication (admin and 2 agents)
- ✓ Application running smoothly on port 5000

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Session Management**: Express sessions with PostgreSQL storage
- **Authentication**: Bcrypt for password hashing, role-based access control
- **API Design**: RESTful API with structured error handling

### Database Architecture
- **Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle ORM with MySQL dialect (configured for potential MySQL migration)
- **Schema**: Type-safe database operations with Zod validation
- **Migrations**: Drizzle Kit for schema management

## Key Components

### Authentication & Authorization
- Session-based authentication with role-based access control
- Two user roles: "agent" and "admin"
- Protected routes with middleware validation
- Automatic session management and logout functionality

### Database Schema
- **Users**: Agents and admins with role-based permissions
- **Products**: Lifestyle insurance products with pricing and benefits
- **Customers**: Client information with banking details and product selections
- **Leads**: Lead generation tracking from website interactions

### Frontend Pages
- **Landing Page**: Product showcase with lead generation
- **Login Page**: Role-based authentication
- **Agent Dashboard**: Customer management and signup forms
- **Admin Dashboard**: Performance metrics and agent statistics

### API Endpoints
- Authentication: `/api/auth/*` (login, logout, profile)
- Products: `/api/products` (product catalog)
- Customers: `/api/customers` (agent customer management)
- Leads: `/api/leads` (lead tracking)
- Admin: `/api/admin/*` (statistics and agent performance)

## Data Flow

1. **Lead Generation**: Visitors interact with products on landing page, creating leads
2. **Agent Assignment**: Leads can be assigned to agents for follow-up
3. **Customer Signup**: Agents fill out detailed customer forms with product selection
4. **Data Persistence**: All interactions stored in PostgreSQL with proper relationships
5. **Analytics**: Admin dashboard aggregates data for performance tracking

## External Dependencies

### Production Dependencies
- **Database**: Neon serverless PostgreSQL
- **UI Library**: Radix UI primitives for accessible components
- **Authentication**: bcrypt for secure password hashing
- **Session Storage**: connect-pg-simple for PostgreSQL session storage
- **Validation**: Zod for runtime type validation
- **Date Handling**: date-fns for date manipulation

### Development Dependencies
- **Build Tools**: Vite with React plugin
- **TypeScript**: Full type safety across frontend and backend
- **Code Quality**: ESLint and TypeScript compiler checking
- **Development Server**: Hot module replacement with Vite

## Deployment Strategy

### Build Process
1. Frontend builds to `dist/public` using Vite
2. Backend bundles to `dist/index.js` using esbuild
3. Single production server serves both static files and API

### Environment Configuration
- Database connection via `DATABASE_URL` environment variable
- Session security via `SESSION_SECRET` environment variable
- Production optimizations for static file serving

### Database Management
- Schema changes managed through Drizzle migrations
- Database pushing via `npm run db:push` command
- Type-safe database operations throughout application

### Development vs Production
- Development: Vite dev server with hot reloading
- Production: Express serves pre-built static files
- Environment-specific configurations for security and performance