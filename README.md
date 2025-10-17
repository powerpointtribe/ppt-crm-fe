# Church Management System Frontend

A modern, minimalist React frontend application for church management built with TypeScript, Tailwind CSS, and Framer Motion.

## Features

- **Dark Minimalist Theme**: Black and white design with subtle animations
- **Responsive Design**: Fully responsive for desktop, tablet, and mobile
- **Smooth Animations**: Powered by Framer Motion for enhanced UX
- **Modern UI Components**: Built with shadcn/ui principles
- **Type Safety**: Full TypeScript implementation
- **API Integration**: Ready to consume REST APIs

## Tech Stack

- **React** 18+ with functional components and hooks
- **TypeScript** for type safety
- **Vite** for fast development and building
- **React Router DOM** for navigation
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Axios** for API calls
- **React Hook Form** + **Zod** for form validation
- **Zustand** for state management
- **Lucide React** for icons

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (Button, Input, etc.)
│   ├── Layout.tsx      # Main layout component
│   ├── Sidebar.tsx     # Navigation sidebar
│   └── Header.tsx      # Page header
├── pages/              # Page components organized by resource
│   ├── Dashboard.tsx   # Dashboard overview
│   ├── Users/          # User management pages
│   ├── Prayers/        # Prayer management pages
│   ├── Payments/       # Payment management pages
│   ├── Transactions/   # Transaction pages
│   └── Estates/        # Estate management pages
├── services/           # API service layer
│   ├── api.ts          # Base API client
│   ├── users.ts        # User API endpoints
│   ├── prayers.ts      # Prayer API endpoints
│   └── ...             # Other resource endpoints
├── hooks/              # Custom React hooks
├── store/              # Zustand store
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── App.tsx             # Main application component
```

## API Integration

The application is designed to consume a REST API at `http://localhost:3000/api`. Update the base URL in `src/services/api.ts` to match your backend.

### Expected API Resources

- `/users` - User management
- `/prayers` - Prayer requests
- `/payments` - Payment processing
- `/transactions` - Transaction history
- `/estates` - Estate management

## Design System

### Color Palette

- **Background**: `#000000` (Pure black)
- **Foreground**: `#ffffff` (Pure white)
- **Muted**: `#262626` (Dark gray)
- **Border**: `#404040` (Medium gray)
- **Accent**: `#171717` (Near black)

### Component Variants

- **Buttons**: Primary (white), Secondary (gray), Ghost (transparent), Danger (red)
- **Cards**: Elevated containers with subtle borders
- **Tables**: Striped rows with hover effects
- **Forms**: Clean inputs with validation states

## Customization

### Adding New Resources

1. Create type definitions in `src/types/`
2. Add API service in `src/services/`
3. Create page components in `src/pages/[Resource]/`
4. Add navigation link in `src/components/Sidebar.tsx`
5. Add routes in `src/App.tsx`

### Theming

Customize the design system by modifying:
- `tailwind.config.js` for colors and theme
- `src/index.css` for global styles
- Component classes for specific styling

## Performance

- **Code Splitting**: Implemented at route level
- **Lazy Loading**: Components loaded on demand
- **Optimized Images**: SVG icons for crisp display
- **Minimal Bundle**: Tree-shaken dependencies

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Follow the existing code style
2. Use TypeScript for all new components
3. Add proper error handling
4. Include responsive design considerations
5. Test across different screen sizes

## License

This project is private and proprietary.