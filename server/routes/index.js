const express = require("express");
const router = express.Router();
const axios = require("axios");

// Place route handlers here

// Add a new route for reverse geocoding
router.get("/geocode/reverse", async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res
      .status(400)
      .json({ error: "Latitude and longitude are required" });
  }

  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;

    // Add a User-Agent header as required by Nominatim
    const response = await axios.get(nominatimUrl, {
      headers: {
        "User-Agent": "SlopeScoutApp/1.0 (your-email@example.com)", // Replace with your app info and email
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching from Nominatim:", error.message);
    if (error.response) {
      // Forward Nominatim's error status and data if available
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: "Failed to fetch address from Nominatim" });
    }
  }
});

module.exports = router;
