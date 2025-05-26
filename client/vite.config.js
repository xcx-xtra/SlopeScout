import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
