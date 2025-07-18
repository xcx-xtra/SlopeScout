const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Define a route for the root path before other routes
app.get("/", (req, res) => {
  res.send("SlopeScout API is running!");
});

const spotRoutes = require("./routes/spots");
const mainRoutes = require("./routes/index"); // Added for geocoding and other general routes

// Use the new mainRoutes for geocoding
app.use("/api", mainRoutes); // Mount general API routes, including geocoding
app.use("/api/spots", spotRoutes);

const PORT = process.env.PORT || 3001;

// For local development
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app; // Export the app for Vercel
