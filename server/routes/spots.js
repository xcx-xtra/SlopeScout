const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
  const { name, lat, lng, elevation } = req.body;
  // Save to Supabase (or mock for now)
  res.send("Spot received");
});

module.exports = router;
