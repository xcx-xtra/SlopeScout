# SlopeScout - Skater Terrain Explorer

SlopeScout is a web application designed for skateboarders to discover, share, and manage skate spots. Users can browse a map of spots (future enhancement), view details, add new spots, and manage their own contributions.

## Features

- **Browse Spots:** Explore skate spots in a list view with search and filtering capabilities.
- **Spot Details:** View detailed information about each spot, including name, description, difficulty, elevation gain, address, location coordinates, and user-submitted images.
- **Add Spots:** Authenticated users can add new skate spots with relevant details and images.
- **Manage Your Spots:** Users can view, edit, and delete spots they have added.
- **Save Spots:** Authenticated users can save their favorite spots for quick access.
- **User Authentication:** Secure login and registration functionality using Supabase Auth.
- **User Profiles:** Users can view their profile information.
- **Reviews:** Users can add and view reviews for spots. (Partially implemented, `SpotDetail.jsx` shows review fetching and submission logic)
- **Responsive Design:** The application is designed to be usable on various screen sizes.

## Tech Stack

**Frontend:**

- React (v18+)
- Vite
- React Router (v6)
- Tailwind CSS
- Supabase Client JS (for authentication and database interactions)
- `react-toastify` (for notifications)
- `react-icons` (for UI icons)

**Backend:**

- Node.js
- Express.js
- Supabase (PostgreSQL database, Authentication, Storage)
- RESTful API

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Node.js (v18.x or later recommended)
- npm (comes with Node.js)
- A Supabase account and a project set up. You will need:
  - Supabase Project URL
  - Supabase Anon Key
  - Database tables set up (e.g., `spots`, `profiles`, `reviews`, `saved_spots`). Ensure RLS policies are configured appropriately.

### Installation

1.  **Clone the repository:**

    ```powershell
    git clone <your-repository-url>
    cd SlopeScout
    ```

2.  **Install Backend Dependencies:**

    ```powershell
    cd server
    npm install
    ```

3.  **Install Frontend Dependencies:**

    ```powershell
    cd ..\client
    npm install
    ```

4.  **Set up Environment Variables:**

    - **Backend (`SlopeScout/server/.env`):**
      Create a `.env` file in the `server` directory and add your Supabase credentials and a port for the server:

      ```env
      VITE_SUPABASE_URL=your_supabase_project_url
      VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
      PORT=3001
      ```

    - **Frontend (`SlopeScout/client/.env`):**
      Create a `.env` file in the `client` directory. Vite requires environment variables exposed to the browser to be prefixed with `VITE_`.
      ```env
      VITE_SUPABASE_URL=your_supabase_project_url
      VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
      ```

### Database Setup (Supabase)

Ensure you have the following tables in your Supabase project. This is a basic schema; you might need to adjust it based on exact project requirements.

- **`profiles`**: For user profile information, often linked to `auth.users`.
  - `id` (uuid, primary key, references `auth.users.id`)
  - `full_name` (text)
  - `avatar_url` (text)
  - `updated_at` (timestamp with time zone)
- **`spots`**: For skate spot details.
  - `id` (bigint, primary key, auto-incrementing)
  - `user_id` (uuid, foreign key to `profiles.id` or `auth.users.id`, represents the creator)
  - `name` (text, not null)
  - `description` (text)
  - `difficulty` (text, e.g., "Easy", "Medium", "Hard")
  - `elevation_gain` (integer)
  - `location` (jsonb, for `lat`, `lng` coordinates)
  - `location_address` (text)
  - `image_url` (text)
  - `created_at` (timestamp with time zone, default now())
- **`reviews`**: For user reviews of spots.
  - `id` (bigint, primary key, auto-incrementing)
  - `spot_id` (bigint, foreign key to `spots.id`)
  - `user_id` (uuid, foreign key to `profiles.id` or `auth.users.id`)
  - `rating` (integer, 1-5)
  - `comment` (text)
  - `created_at` (timestamp with time zone, default now())
- **`saved_spots`**: To link users to their saved spots (many-to-many).
  - `id` (bigint, primary key, auto-incrementing)
  - `user_id` (uuid, foreign key to `profiles.id` or `auth.users.id`)
  - `spot_id` (bigint, foreign key to `spots.id`)
  - `created_at` (timestamp with time zone, default now())
  - (Consider adding a unique constraint on `(user_id, spot_id)`)

**Row Level Security (RLS):**
It is crucial to set up RLS policies on your Supabase tables. For example:

- Users should only be able to `INSERT` spots if they are authenticated.
- Users should only be able to `UPDATE` or `DELETE` spots they created.
- `SELECT` operations might be public for spots, but user-specific for `saved_spots` or `profiles`.

### Running the Application

1.  **Start the Backend Server:**
    Open a terminal, navigate to the `SlopeScout/server` directory:

    ```powershell
    npm start
    ```

    The backend server will typically start on `http://localhost:3001` (or the port specified in `server/.env`).

2.  **Start the Frontend Development Server:**
    Open another terminal, navigate to the `SlopeScout/client` directory:

    ```powershell
    npm run dev
    ```

    The frontend development server (Vite) will typically start on `http://localhost:5173`.

3.  Open your browser and navigate to the frontend URL (e.g., `http://localhost:5173`).

## Project Structure

```
SlopeScout/
├── client/               # Frontend React application (Vite)
│   ├── public/           # Static assets
│   ├── src/
│   │   ├── assets/       # Images, fonts, etc.
│   │   ├── components/   # Reusable UI components (e.g., Map, Login, SpotForm)
│   │   ├── pages/        # Page-level components
│   │   │   └── Spots/    # Spot related pages (AddSpot, EditSpot, ManageSpots, SpotDetail, SpotList)
│   │   ├── App.jsx       # Main application component with routing
│   │   ├── main.jsx      # Entry point for React app
│   │   ├── index.css     # Global styles
│   │   └── supabaseClient.js # Supabase client initialization for frontend
│   ├── .env              # Environment variables for client (VITE_ prefix)
│   ├── eslint.config.js
│   ├── index.html        # Main HTML file for Vite
│   ├── package.json
│   ├── postcss.config.js # PostCSS configuration
│   ├── tailwind.config.js# Tailwind CSS configuration
│   └── vite.config.js    # Vite configuration
├── server/               # Backend Node.js/Express application
│   ├── controllers/      # Request handlers (business logic for spots, auth, etc.)
│   ├── middleware/       # Express middleware (e.g., auth checks)
│   ├── routes/           # API route definitions
│   ├── utils/            # Utility functions (e.g., Supabase client for backend)
│   ├── .env              # Environment variables for server
│   ├── package.json
│   └── server.js         # Main backend server entry point
└── README.md             # This file
```

## API Endpoints

The backend exposes the following RESTful API endpoints (主なもの):

- **Authentication (managed by Supabase, but your backend might have wrapper routes if needed or custom auth logic)**

  - Typically, client interacts directly with Supabase for login/register, or you might proxy via `/api/auth/login`, `/api/auth/register`.

- **Spots (`/api/spots`)**

  - `GET /`: Get all spots.
  - `GET /:id`: Get a single spot by ID.
  - `POST /`: Create a new spot (requires authentication).
  - `PUT /:id`: Update an existing spot (requires authentication, user must be owner).
  - `DELETE /:id`: Delete a spot (requires authentication, user must be owner).
  - `POST /:spot_id/save`: Save a spot for the current user (requires authentication).
  - `DELETE /:spot_id/unsave`: Unsave a spot for the current user (requires authentication).
  - `GET /users/me/saved-spots`: Get all saved spots for the current authenticated user.
  - `GET /user/my-spots`: Get all spots created by the current authenticated user.

- **Reviews (`/api/spots/:spot_id/reviews`)**
  - `GET /`: Get all reviews for a specific spot.
  - `POST /`: Create a new review for a spot (requires authentication).

_(Note: Ensure your backend routes in `server/routes/` match these descriptions.)_

## Contributing

Contributions are welcome! If you'd like to contribute:

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## License

This project can be licensed under the MIT License if you choose. Create a `LICENSE.md` file with the MIT License text.

---

_This README provides a general overview. Update it with more specific details as your project evolves._
