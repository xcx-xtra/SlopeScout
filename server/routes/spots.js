const express = require("express");
const router = express.Router();
const spotController = require("../controllers/spotController");

// POST /api/spots
router.post("/", spotController.createSpot);
// GET /api/spots
router.get("/", spotController.getSpots);
// GET /api/spots/:id
router.get("/:id", spotController.getSpotById);
// PUT /api/spots/:id
router.put("/:id", spotController.updateSpot);
// DELETE /api/spots/:id
router.delete("/:id", spotController.deleteSpot);

module.exports = router;
