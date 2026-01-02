# DRD Fitness - Custom Workout Builder

A modern workout tracking application for creating, managing, and tracking your training programs. Built with React, Express, and PostgreSQL.

## Features

- **Workout Management**: Create and organize workout programs with multiple training days
- **Exercise Tracking**: Add exercises with sets, reps, and weight in kilograms (KG)
- **Per-Set Tracking**: Track individual sets with custom weights and completion status
- **Drag & Drop**: Reorder exercises easily with drag-and-drop functionality
- **Day Duplication**: Clone workout days to quickly create variations
- **Data Import/Export**: Backup and restore your data as JSON or CSV
- **PWA Support**: Install as an app on your device for offline access

## Architecture

### Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── domain/         # Business logic layer (pure functions)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and query client
│   │   ├── pages/          # Page components
│   │   └── services/       # API service layer
│   └── public/             # Static assets and PWA files
├── server/                 # Backend Express application
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Database operations
│   └── db.ts               # Database connection
└── shared/                 # Shared code between frontend and backend
    ├── schema.ts           # Database schema and types
    └── routes.ts           # API route type definitions
```

### Domain Layer (`client/src/domain/`)

The domain layer contains pure business logic separated from UI concerns:

- **types.ts**: TypeScript interfaces for all data models
- **workout.ts**: Workout-related logic (set completion, progress calculation, reordering)
- **export.ts**: Data export/import formatting functions

This separation allows:
- Easy unit testing of business logic
- Reusability across components
- Clear separation of concerns

### Services Layer (`client/src/services/`)

The services layer handles API communication:

- **api.ts**: Typed API client for all backend endpoints

### Future Extensibility

The architecture is designed for easy extension:

| Feature | Domain Module | Backend Endpoint | Page |
|---------|--------------|------------------|------|
| Meal Planner | `domain/meals.ts` | `/api/meals` | `/meals` |
| Progress Charts | `domain/progress.ts` | `/api/progress` | `/progress` |
| User Profiles | `domain/user.ts` | `/api/users` | `/profile` |

## Offline Functionality

### How It Works

DRD Fitness is a **Progressive Web App (PWA)** that uses service workers for offline capability:

1. **Service Worker Caching**: Static assets (HTML, CSS, JS) are cached for offline access
2. **Network-First Strategy**: API requests try the network first, falling back to cached data
3. **Installable**: Can be installed as an app on desktop and mobile devices

### Limitations

**Important**: This is a fullstack application that requires:
- A running server (Node.js/Express)
- A PostgreSQL database connection

Offline mode provides:
- Cached views of previously loaded data
- The ability to browse the UI
- Queued changes that sync when back online (future enhancement)

Offline mode does NOT support:
- Creating new workouts without connectivity
- Real-time data sync without a server

### Installing as an App

1. Open the app in Chrome/Edge/Safari
2. Look for "Install" option in the browser menu or address bar
3. Click to install - the app will appear as a standalone application

## Running the Application

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Development

```bash
npm install
npm run dev
```

The app runs on port 5000 by default.

### Environment Variables

| Variable | Description |
|----------|-------------|
| DATABASE_URL | PostgreSQL connection string |
| SESSION_SECRET | Secret for session management |

## Data Management

### Export

- **JSON Export**: Full backup including all workout data and set information
- **CSV Export**: Spreadsheet-compatible format with per-set details

### Import

- Import previously exported JSON files
- Option to replace all existing data or add to it
- Validated and transactional for data integrity

### Reset

- Delete all workouts, days, and exercises
- Requires confirmation to prevent accidental data loss

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **State**: TanStack Query (React Query)
- **Animations**: Framer Motion
- **Drag & Drop**: @dnd-kit
- **Build**: Vite

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workouts` | List all workouts |
| GET | `/api/workouts/:id` | Get workout details |
| POST | `/api/workouts` | Create workout |
| DELETE | `/api/workouts/:id` | Delete workout |
| POST | `/api/workouts/:id/days` | Create day |
| DELETE | `/api/days/:id` | Delete day |
| POST | `/api/days/:id/duplicate` | Duplicate day |
| POST | `/api/days/:dayId/exercises` | Create exercise |
| PATCH | `/api/exercises/:id` | Update exercise |
| DELETE | `/api/exercises/:id` | Delete exercise |
| POST | `/api/days/:dayId/exercises/reorder` | Reorder exercises |
| GET | `/api/data/export` | Export all data |
| POST | `/api/data/import` | Import data |
| DELETE | `/api/data/reset` | Reset all data |

## License

MIT
