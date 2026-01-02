# Church Management System - Frontend

A modern, responsive church management system frontend built with React, TypeScript, and Tailwind CSS. This application provides a comprehensive interface for managing members, first-timers, service reports, inventory, and more.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Key Features](#key-features)
- [Mobile Responsiveness](#mobile-responsiveness)
- [Deployment](#deployment)

## Features

- **Dashboard**: Overview with key metrics, charts, and quick actions
- **Member Management**: CRUD operations, bulk import, birthday tracking, location assignments
- **First-Timer Tracking**: Registration, follow-up workflow, call reports, integration pipeline
- **Service Reports**: Attendance tracking, analytics, PDF export
- **Groups Management**: Districts, Units, Ministries with member assignments
- **Inventory Management**: Item tracking, stock movements, low stock alerts
- **Role-Based Access**: UI adapts based on user permissions
- **Mobile Responsive**: Full mobile support with card-based layouts

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router v6
- **Forms**: React Hook Form
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Charts**: Recharts
- **HTTP Client**: Axios

## Prerequisites

- Node.js >= 18.x
- npm or yarn
- Backend API running (see backend README)

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd church-management-system-frontend

# Install dependencies
npm install
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
VITE_API_URL=http://localhost:3001

# Optional: Analytics
VITE_GA_TRACKING_ID=

# Optional: Feature Flags
VITE_ENABLE_INVENTORY=true
VITE_ENABLE_SERVICE_REPORTS=true
```

## Running the Application

```bash
# Development mode (with hot reload)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint
```

The application will be available at `http://localhost:5173`

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Base UI components (Button, Card, Modal, etc.)
│   ├── forms/           # Form components
│   ├── charts/          # Chart components
│   └── Layout.tsx       # Main layout component
├── pages/               # Page components (route-based)
│   ├── Dashboard/
│   ├── Members/
│   ├── FirstTimers/
│   ├── Groups/
│   ├── ServiceReports/
│   ├── Inventory/
│   ├── Branches/
│   └── Settings/
├── services/            # API service functions
│   ├── api.ts           # Axios instance configuration
│   ├── auth.ts          # Authentication service
│   ├── members.ts       # Members API
│   ├── first-timers.ts  # First-timers API
│   └── ...
├── hooks/               # Custom React hooks
│   ├── useAuth.ts
│   ├── useToast.ts
│   └── ...
├── contexts/            # React contexts
│   └── AuthContext.tsx
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
│   ├── formatters.ts
│   ├── validators.ts
│   └── cn.ts            # Class name utility
└── App.tsx              # Main app component
```

## Key Features

### Authentication
- JWT-based authentication
- Automatic token refresh
- Protected routes
- Password reset flow

### Member Management
- List view with search, filters, and pagination
- Bulk import via CSV
- Birthday tracking with notifications
- District and unit assignment
- Member detail view with activity history

### First-Timer Tracking
- Registration (including public form)
- Status workflow: New → Engaged → Ready → Member
- Follow-up tracking with call reports
- Integration pipeline to convert to members
- Archive and restore functionality

### Service Reports
- Create and edit service reports
- Attendance analytics with charts
- PDF generation and export
- Service tags and categorization

### Groups Management
- Create districts, units, ministries
- Assign leaders (pastors, unit heads)
- Member management within groups
- Meeting schedule configuration

### Inventory Management
- Item tracking with categories
- Stock movements (in/out)
- Low stock alerts
- Expiry date tracking

## Mobile Responsiveness

All listing pages feature dual-view layouts:

- **Desktop (>=768px)**: Full-featured table views with all columns
- **Mobile (<768px)**: Card-based layouts optimized for touch

Key responsive patterns:
- `md:hidden` / `hidden md:block` for view switching
- Collapsible filters on mobile
- Touch-friendly action buttons
- Responsive navigation drawer

## Components

### UI Components

| Component | Description |
|-----------|-------------|
| `Button` | Styled button with variants |
| `Card` | Container component |
| `Modal` | Dialog/modal component |
| `Badge` | Status badge component |
| `Input` | Form input component |
| `Select` | Dropdown select component |
| `Table` | Data table component |
| `LoadingSpinner` | Loading indicator |
| `Toast` | Notification toasts |

### Layout

The main layout includes:
- Responsive sidebar navigation
- Top header with user menu
- Breadcrumb navigation
- Toast notification container

## API Integration

All API calls go through the centralized Axios instance in `src/services/api.ts`:

```typescript
import { apiService } from '@/services/api'

// GET request
const members = await apiService.get('/members')

// POST request
const newMember = await apiService.post('/members', data)

// PATCH request
await apiService.patch(`/members/${id}`, data)

// DELETE request
await apiService.delete(`/members/${id}`)
```

## Deployment

### Build for Production

```bash
npm run build
```

The build output will be in the `dist/` folder.

### Static Hosting (Netlify, Vercel, etc.)

A `_redirects` file is included for SPA routing:

```
/*    /index.html   200
```

### Docker Deployment

```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Environment-Specific Builds

```bash
# Development
VITE_API_URL=http://localhost:3001 npm run build

# Staging
VITE_API_URL=https://api-staging.yourchurch.com npm run build

# Production
VITE_API_URL=https://api.yourchurch.com npm run build
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT License
