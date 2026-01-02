# DRD Fitness

## Overview

DRD Fitness is a workout tracking application that allows users to create, manage, and track their training programs. Users can organize workouts into days, add exercises with sets/reps/weight tracking, and monitor their progress. The app supports drag-and-drop reordering of exercises, data import/export functionality, and per-set tracking with individual weight and rep values.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query (React Query) for server state
- **Styling**: Tailwind CSS with CSS variables for theming
- **UI Components**: shadcn/ui component library (Radix UI primitives)
- **Animations**: Framer Motion for smooth transitions
- **Drag & Drop**: @dnd-kit for exercise reordering
- **Forms**: React Hook Form with Zod validation

The frontend follows a component-based architecture with:
- Pages in `client/src/pages/`
- Reusable components in `client/src/components/`
- UI primitives in `client/src/components/ui/`
- Custom hooks in `client/src/hooks/`

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **Build Tool**: Vite for frontend, esbuild for server bundling
- **API Style**: REST endpoints defined in `shared/routes.ts`

The backend serves both the API and static files. In development, Vite middleware handles hot module replacement. In production, pre-built static files are served.

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: `shared/schema.ts`

Data model consists of:
- `workouts` - Training programs (name, description)
- `workoutDays` - Days within a workout (name, order)
- `exercises` - Individual exercises (name, sets, reps, weight, notes, setData for per-set tracking)

### Shared Code
The `shared/` directory contains code used by both frontend and backend:
- `schema.ts` - Database schema and Zod validation schemas
- `routes.ts` - API route definitions with input/output types

This pattern ensures type safety across the full stack.

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connected via `DATABASE_URL` environment variable
- **connect-pg-simple**: Session storage (available but sessions not currently implemented)

### Key NPM Packages
- **drizzle-orm / drizzle-kit**: Database ORM and migration tooling
- **@tanstack/react-query**: Async state management
- **framer-motion**: Animation library
- **@dnd-kit/***: Drag and drop functionality
- **zod**: Runtime type validation
- **date-fns**: Date formatting utilities

### Build & Development
- **Vite**: Frontend dev server and bundler
- **esbuild**: Server bundling for production
- **tsx**: TypeScript execution for development

### Replit-Specific
- **@replit/vite-plugin-runtime-error-modal**: Error overlay in development
- **@replit/vite-plugin-cartographer**: Development tooling