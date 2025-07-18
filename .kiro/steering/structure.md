# Project Structure & Organization

## Root Level Organization

```
SlopeScout/
├── client/          # Frontend React application
├── server/          # Backend Express API
├── .kiro/           # Kiro AI assistant configuration
├── vercel.json      # Vercel deployment configuration
└── README.md        # Project documentation
```

## Frontend Structure (`client/`)

```
client/
├── src/
│   ├── components/  # Reusable UI components
│   ├── pages/       # Page-level components
│   │   └── Spots/   # Spot-related pages (AddSpot, EditSpot, etc.)
│   ├── assets/      # Static assets (images, fonts)
│   ├── utils/       # Utility functions
│   ├── App.jsx      # Main app component with routing
│   ├── main.jsx     # React entry point
│   └── supabaseClient.js # Supabase client configuration
├── public/          # Static public assets
├── dist/            # Build output directory
└── package.json     # Frontend dependencies and scripts
```

## Backend Structure (`server/`)

```
server/
├── controllers/     # Business logic and request handlers
├── routes/          # API route definitions
├── middleware/      # Express middleware (auth, validation)
├── utils/           # Backend utility functions
├── server.js        # Main server entry point
└── package.json     # Backend dependencies
```

## Key Architectural Patterns

### Frontend Patterns

- **Component-based architecture** with reusable UI components
- **Page-based routing** using React Router
- **Feature-based organization** (e.g., Spots pages grouped together)
- **Centralized state management** through React hooks and context
- **Supabase client** for direct database and auth interactions

### Backend Patterns

- **MVC-like structure** with controllers handling business logic
- **Route-based API organization** (`/api/spots`, `/api/auth`)
- **Middleware pattern** for cross-cutting concerns
- **RESTful API design** with standard HTTP methods
- **Supabase integration** for database operations

### File Naming Conventions

- **PascalCase** for React components (`SpotDetail.jsx`)
- **camelCase** for utility functions and variables
- **kebab-case** for route files and general files
- **Descriptive names** that indicate purpose and scope

### Environment Configuration

- **Separate `.env` files** for client and server
- **VITE\_ prefix** required for client-side environment variables
- **Environment-specific configurations** for development vs production
