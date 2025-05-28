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

// Routes for saving/unsaving spots
router.post("/:spot_id/save", spotController.saveSpot);
router.delete("/:spot_id/unsave", spotController.unsaveSpot);
// Route to get user's saved spots - consider moving to a userRoutes.js if it grows
router.get("/users/me/saved-spots", spotController.getSavedSpots);
// Route to get spots created by the current user
router.get("/user/my-spots", spotController.getUserSpots);

// Routes for spot reviews
router.get("/:spot_id/reviews", spotController.getSpotReviews);
router.post("/:spot_id/reviews", spotController.createSpotReview);

module.exports = router;
