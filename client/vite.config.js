import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Add server configuration
    proxy: {
      // string shorthand: http://localhost:5173/foo -> http://localhost:5173/foo
      "/api": {
        target: "http://localhost:3001", // Your backend server address
        changeOrigin: true,
        secure: false, // If your backend is not HTTPS
        // rewrite: (path) => path.replace(/^\/api/, '') // Optional: if you need to remove /api prefix
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("mapbox-gl")) {
              return "mapbox-gl";
            }
            if (
              id.includes("react-router-dom") ||
              id.includes("@remix-run") ||
              id.includes("react-router")
            ) {
              return "react-router";
            }
            if (id.includes("@supabase")) {
              return "supabase";
            }
            // You can add more conditions here for other large libraries
            // For example, to group all other node_modules into a vendor chunk:
            // return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600, // Optional: Adjust if needed after chunking
  },
});
