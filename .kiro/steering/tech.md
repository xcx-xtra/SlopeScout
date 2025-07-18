# Technology Stack & Build System

## Frontend Stack

- **React 19** with Vite as build tool
- **React Router v7** for client-side routing
- **Tailwind CSS v4** for styling with custom color scheme
- **Supabase Client JS** for authentication and database interactions
- **Mapbox GL** for map functionality
- **React Icons** for UI icons
- **React Toastify** for notifications
- **Axios** for HTTP requests

## Backend Stack

- **Node.js** with **Express.js** framework
- **Supabase** (PostgreSQL database, Authentication, Storage)
- **RESTful API** architecture
- **CORS** enabled for cross-origin requests
- **JWT** for token handling

## Build System & Tools

- **Vite** for frontend development and building
- **ESLint** for code linting
- **PostCSS** with Autoprefixer
- **Tailwind CSS** with forms and typography plugins

## Common Commands

### Development

```bash
# Start backend server (from server directory)
npm start

# Start frontend dev server (from client directory)
npm run dev

# Install dependencies
npm install
```

### Build & Deploy

```bash
# Build frontend for production (from client directory)
npm run build

# Preview production build (from client directory)
npm run preview

# Lint code (from client directory)
npm run lint
```

## Environment Variables

- Frontend: Use `VITE_` prefix for browser-exposed variables
- Backend: Standard environment variables in `.env`
- Required: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `PORT`

## Deployment

- **Vercel** deployment with separate builds for client (Vite) and server (Node.js)
- API routes proxied through `/api/*` to backend
- Frontend serves as SPA with fallback to `index.html`
