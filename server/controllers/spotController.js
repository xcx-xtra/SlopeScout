// Spot controller for CRUD operations
const { createClient } = require("@supabase/supabase-js");
const supabase = require("../utils/supabase");
require("dotenv").config();

// POST /api/spots - Create a spot
exports.createSpot = async (req, res) => {
  const { user_id, name, description, difficulty, elevation_gain, location } =
    req.body;
  // Get the user's access token from the Authorization header
  const authHeader = req.headers["authorization"];
  const token =
    authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  // Use JWT-based Supabase client only if token is present, otherwise use default client
  let sbClient;
  if (token) {
    sbClient = require("@supabase/supabase-js").createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
  } else {
    sbClient = supabase;
  }
  const { data, error } = await sbClient
    .from("spots")
    .insert([
      { user_id, name, description, difficulty, elevation_gain, location },
    ]);
  if (error) {
    console.error("Supabase insert error:", error);
    return res.status(400).json({ error: error.message, details: error });
  }
  res.json(data);
};

// GET /api/spots - Get all spots
exports.getSpots = async (req, res) => {
  const { data, error } = await supabase.from("spots").select("*");
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

// GET /api/spots/:id - Get a spot by ID
exports.getSpotById = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("spots")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

// PUT /api/spots/:id - Update
exports.updateSpot = async (req, res) => {
  const { id } = req.params;
  // Explicitly list fields that can be updated
  const { name, description, difficulty, elevation_gain, location } = req.body;

  const authHeader = req.headers["authorization"];
  const token =
    authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "User not authenticated for update" });
  }

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("Error fetching user for update:", userError);
      return res
        .status(401)
        .json({ error: "Invalid token or user not found for update" });
    }

    // Verify ownership before updating
    const { data: spotToUpdate, error: spotFetchError } = await supabase
      .from("spots")
      .select("user_id")
      .eq("id", id)
      .single();

    if (spotFetchError) {
      console.error(
        "Error fetching spot for update (ownership check):",
        spotFetchError
      );
      // Differentiate between not found and other errors if possible
      if (spotFetchError.code === "PGRST116") {
        // PGRST116: No rows found
        return res.status(404).json({ error: "Spot not found." });
      }
      return res.status(500).json({ error: "Error fetching spot data." });
    }

    if (spotToUpdate.user_id !== user.id) {
      return res
        .status(403)
        .json({ error: "User not authorized to update this spot" });
    }

    // Construct the update object with only the fields provided in the request
    const updateFields = {};
    if (name !== undefined) updateFields.name = name.trim();
    if (description !== undefined)
      updateFields.description = description.trim();
    if (difficulty !== undefined) updateFields.difficulty = difficulty;
    if (elevation_gain !== undefined) {
      // Ensure elevation_gain is a number or null if empty string
      updateFields.elevation_gain =
        elevation_gain === "" ? null : Number(elevation_gain);
      if (
        isNaN(updateFields.elevation_gain) &&
        updateFields.elevation_gain !== null
      ) {
        return res.status(400).json({
          error: "Invalid elevation gain. Must be a number or empty.",
        });
      }
    }
    if (location !== undefined) {
      // Assuming location is an object { lat, lng }
      if (
        typeof location === "object" &&
        location !== null &&
        location.hasOwnProperty("lat") &&
        location.hasOwnProperty("lng")
      ) {
        updateFields.location = location;
      } else if (typeof location === "string") {
        try {
          const parsedLocation = JSON.parse(location);
          if (
            typeof parsedLocation === "object" &&
            parsedLocation !== null &&
            parsedLocation.hasOwnProperty("lat") &&
            parsedLocation.hasOwnProperty("lng")
          ) {
            updateFields.location = parsedLocation;
          } else {
            return res.status(400).json({
              error:
                "Invalid location format. Must be an object with lat and lng properties, or a valid JSON string of such an object.",
            });
          }
        } catch (e) {
          return res
            .status(400)
            .json({ error: "Invalid location JSON string." });
        }
      } else if (location === null) {
        updateFields.location = null; // Allow explicitly setting location to null
      } else if (location !== undefined) {
        // if location is present but not valid object, string or null
        return res.status(400).json({
          error:
            "Invalid location format. Must be an object with lat and lng properties, a valid JSON string, or null.",
        });
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return res
        .status(400)
        .json({ error: "No valid fields provided for update." });
    }

    const { data, error: updateError } = await supabase
      .from("spots")
      .update(updateFields)
      .eq("id", id)
      .select(); // Return the updated record

    if (updateError) {
      console.error("Supabase update error:", updateError);
      return res
        .status(400)
        .json({ error: updateError.message, details: updateError });
    }
    // Supabase returns an array, even for single record updates with .select()
    res.json({
      message: "Spot updated successfully",
      data: data && data.length > 0 ? data[0] : null,
    });
  } catch (err) {
    console.error("Server error during spot update:", err);
    res.status(500).json({ error: "Internal server error during spot update" });
  }
};

// DELETE /api/spots/:id - Delete
exports.deleteSpot = async (req, res) => {
  const { id } = req.params;
  const authHeader = req.headers["authorization"];
  const token =
    authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("Error fetching user for delete:", userError);
      return res.status(401).json({ error: "Invalid token or user not found" });
    }

    const { data: spotData, error: spotError } = await supabase
      .from("spots")
      .select("user_id")
      .eq("id", id)
      .single();

    if (spotError || !spotData) {
      console.error("Error fetching spot for delete:", spotError);
      return res.status(404).json({ error: "Spot not found" });
    }

    if (spotData.user_id !== user.id) {
      return res
        .status(403)
        .json({ error: "User not authorized to delete this spot" });
    }

    const { error: deleteError } = await supabase
      .from("spots")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Supabase delete error:", deleteError);
      return res.status(400).json({ error: deleteError.message });
    }
    res.json({ success: true, message: "Spot deleted successfully" });
  } catch (err) {
    console.error("Server error during spot deletion:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// --- Saved Spots ---

// POST /api/spots/:spot_id/save - Save a spot for the current user
exports.saveSpot = async (req, res) => {
  const { spot_id } = req.params;
  const authHeader = req.headers["authorization"];
  const token =
    authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const { data: spotExists, error: spotCheckError } = await supabase
      .from("spots")
      .select("id")
      .eq("id", spot_id)
      .single();

    if (spotCheckError || !spotExists) {
      return res.status(404).json({ error: "Spot not found" });
    }

    const { data: existingSave, error: existingSaveError } = await supabase
      .from("saved_spots")
      .select("*")
      .eq("user_id", user.id)
      .eq("spot_id", spot_id)
      .maybeSingle();

    if (existingSaveError && existingSaveError.code !== "PGRST116") {
      console.error("Error checking existing saved spot:", existingSaveError);
      return res.status(500).json({ error: "Error checking saved status" });
    }
    if (existingSave) {
      return res.status(409).json({ message: "Spot already saved" });
    }

    const { data, error } = await supabase
      .from("saved_spots")
      .insert([{ user_id: user.id, spot_id: parseInt(spot_id) }])
      .select();

    if (error) {
      console.error("Supabase save spot error:", error);
      return res.status(400).json({ error: error.message, details: error });
    }
    res.status(201).json({ message: "Spot saved successfully", data });
  } catch (err) {
    console.error("Server error during save spot:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// DELETE /api/spots/:spot_id/unsave - Unsave a spot for the current user
exports.unsaveSpot = async (req, res) => {
  const { spot_id } = req.params;
  const authHeader = req.headers["authorization"];
  const token =
    authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const { error } = await supabase
      .from("saved_spots")
      .delete()
      .eq("user_id", user.id)
      .eq("spot_id", parseInt(spot_id));

    if (error) {
      console.error("Supabase unsave spot error:", error);
      return res.status(400).json({ error: error.message, details: error });
    }
    res.json({ message: "Spot unsaved successfully" });
  } catch (err) {
    console.error("Server error during unsave spot:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/spots/users/me/saved-spots - Get all saved spots for the current user
exports.getSavedSpots = async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token =
    authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const { data: savedSpotEntries, error: savedError } = await supabase
      .from("saved_spots")
      .select("spot_id")
      .eq("user_id", user.id);

    if (savedError) {
      console.error("Supabase get saved spots error:", savedError);
      return res.status(400).json({ error: savedError.message });
    }

    if (!savedSpotEntries || savedSpotEntries.length === 0) {
      return res.json([]);
    }

    const spotIds = savedSpotEntries.map((entry) => entry.spot_id);

    const { data: spots, error: spotsError } = await supabase
      .from("spots")
      .select("*")
      .in("id", spotIds);

    if (spotsError) {
      console.error("Supabase get spot details error:", spotsError);
      return res.status(400).json({ error: spotsError.message });
    }

    res.json(spots);
  } catch (err) {
    console.error("Server error during get saved spots:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
