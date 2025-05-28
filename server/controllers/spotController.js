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
  const spotIdParam = req.params.id; // Keep original param for logging
  const spotId = parseInt(spotIdParam, 10); // Ensure ID is an integer

  if (isNaN(spotId)) {
    console.error(`Invalid spot ID format: ${spotIdParam}`);
    return res.status(400).json({ error: "Invalid spot ID format." });
  }

  const authHeader = req.headers["authorization"];
  const token =
    authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    console.error(`Delete Spot ID ${spotId}: No token provided.`);
    return res.status(401).json({ error: "User not authenticated" });
  }

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token); // Get user details using the global client

    if (userError || !user) {
      console.error(
        `Delete Spot ID ${spotId}: Invalid token or user not found.`,
        userError
      );
      return res.status(401).json({ error: "Invalid token or user not found" });
    }

    // Create a new Supabase client instance scoped to this user for data operations
    const userScopedSupabaseClient = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY, // Use the anon key here
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    // Pre-check ownership using the user-scoped client
    const { data: spotToDelete, error: spotFetchError } =
      await userScopedSupabaseClient
        .from("spots")
        .select("user_id") // RLS for SELECT must allow this user to see user_id
        .eq("id", spotId)
        .single();

    if (spotFetchError) {
      console.error(
        `Error fetching spot for delete pre-check (ID ${spotId}) using user-scoped client:`,
        spotFetchError
      );
      if (spotFetchError.code === "PGRST116") {
        // No rows found
        return res
          .status(404)
          .json({ error: "Spot not found for pre-check (user-scoped)." });
      }
      return res.status(500).json({
        error: "Error fetching spot data for pre-check (user-scoped).",
      });
    }

    if (spotToDelete.user_id !== user.id) {
      console.warn(
        `Delete Spot ID ${spotId}: User ${user.id} attempted to delete spot owned by ${spotToDelete.user_id}. (Pre-check with user-scoped client)`
      );
      return res.status(403).json({
        error: "User not authorized to delete this spot (application check).",
      });
    }

    console.log(
      `Attempting to delete spot ID ${spotId} by user ${user.id} using user-scoped client.`
    );

    const {
      data: deleteResponseData,
      error: deleteError,
      count: deleteCount,
    } = await userScopedSupabaseClient
      .from("spots")
      .delete({ count: "exact" }) // Ensure { count: "exact" } is applied
      .eq("id", spotId)
      .eq("user_id", user.id);

    console.log(
      `User-scoped delete for spot ID ${spotId}, user ${user.id} (chained .eq(), with { count: "exact" }) result:\n`,
      `  Response Data: `,
      deleteResponseData,
      `\n`,
      `  Error: `,
      deleteError,
      `\n`,
      `  Count: `,
      deleteCount
    );

    if (deleteError) {
      console.error(
        `Supabase delete error for spot ID ${spotId} (user-scoped client):`,
        deleteError
      );
      return res
        .status(400)
        .json({ error: deleteError.message, details: deleteError });
    }

    // With { count: "exact" }, deleteCount should ideally be a number (0 or more).
    // A null count here is unexpected and indicates an issue.
    if (deleteCount === null) {
      console.error(
        `Supabase returned null count for user-scoped delete of spot ID ${spotId} by user ${user.id} even with { count: "exact" }. This is unexpected. Treating as failure.`
      );
      return res.status(500).json({
        error:
          "Failed to delete spot. Uncertain outcome from database operation.",
      });
    }

    if (deleteCount === 0) {
      console.warn(
        `Spot ID ${spotId} was not deleted (count is 0) with user-scoped client and { count: "exact" }. User ${user.id}. ` +
          `RLS likely prevented the delete, or the spot was already gone/not matching conditions.`
      );
      return res.status(404).json({
        error:
          "Spot not found or user not authorized to delete this spot (delete count was 0).",
      });
    }

    // If deleteCount > 0, the deletion was successful.
    console.log(
      `Successfully deleted spot ID ${spotId} by user ${user.id}. Count: ${deleteCount}.`
    );
    res.json({ message: "Spot deleted successfully" });
  } catch (err) {
    console.error(
      `Server error during spot delete for ID ${spotIdParam} (user-scoped attempt):`,
      err
    );
    res.status(500).json({ error: "Internal server error during spot delete" });
  }
};

// --- Saved Spots ---

// POST /api/spots/:spot_id/save - Save a spot
exports.saveSpot = async (req, res) => {
  const { spot_id } = req.params;
  const authHeader = req.headers["authorization"];
  const token =
    authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    console.error("Save Spot Error: No token provided.");
    return res.status(401).json({ error: "User not authenticated." });
  }

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error(
        "Save Spot Error: Invalid token or user not found.",
        userError
      );
      return res
        .status(401)
        .json({ error: "Invalid token or user not found." });
    }

    // Check if the spot exists
    const { data: spotExists, error: spotCheckError } = await supabase
      .from("spots")
      .select("id")
      .eq("id", spot_id)
      .single();

    if (spotCheckError || !spotExists) {
      console.error(
        "Save Spot Error: Spot not found or error checking spot.",
        spotCheckError
      );
      return res.status(404).json({ error: "Spot not found." });
    }

    // Check if already saved
    const { data: existingSave, error: existingSaveError } = await supabase
      .from("saved_spots")
      .select("*")
      .eq("user_id", user.id)
      .eq("spot_id", spot_id)
      .maybeSingle();

    if (existingSaveError) {
      console.error(
        "Save Spot Error: Error checking for existing save.",
        existingSaveError
      );
      return res.status(500).json({
        error: "Database error checking saved status.",
        details: existingSaveError.message,
      });
    }

    if (existingSave) {
      return res.status(409).json({ message: "Spot already saved." }); // 409 Conflict
    }

    const { data, error: saveError } = await supabase
      .from("saved_spots")
      .insert([{ user_id: user.id, spot_id: parseInt(spot_id) }]) // Ensure spot_id is integer
      .select(); // Optionally select the created record

    if (saveError) {
      console.error("Save Spot Error: Supabase insert error.", saveError);
      return res
        .status(400)
        .json({ error: "Failed to save spot.", details: saveError.message });
    }
    res
      .status(201)
      .json({ message: "Spot saved successfully!", data: data ? data[0] : {} });
  } catch (err) {
    console.error("Save Spot Error: Server error.", err);
    res.status(500).json({ error: "Internal server error while saving spot." });
  }
};

// DELETE /api/spots/:spot_id/unsave - Unsave a spot
exports.unsaveSpot = async (req, res) => {
  const { spot_id } = req.params;
  const authHeader = req.headers["authorization"];
  const token =
    authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    console.error("Unsave Spot Error: No token provided.");
    return res.status(401).json({ error: "User not authenticated." });
  }

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error(
        "Unsave Spot Error: Invalid token or user not found.",
        userError
      );
      return res
        .status(401)
        .json({ error: "Invalid token or user not found." });
    }

    const { error: deleteError } = await supabase
      .from("saved_spots")
      .delete()
      .match({ user_id: user.id, spot_id: parseInt(spot_id) }); // Ensure spot_id is integer

    if (deleteError) {
      console.error("Unsave Spot Error: Supabase delete error.", deleteError);
      return res.status(400).json({
        error: "Failed to unsave spot.",
        details: deleteError.message,
      });
    }
    res.json({ message: "Spot unsaved successfully!" });
  } catch (err) {
    console.error("Unsave Spot Error: Server error.", err);
    res
      .status(500)
      .json({ error: "Internal server error while unsaving spot." });
  }
};

// GET /api/spots/users/me/saved-spots - Get all saved spots for the current user
exports.getSavedSpots = async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token =
    authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    console.error("Get Saved Spots Error: No token provided.");
    return res.status(401).json({ error: "User not authenticated." });
  }

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error(
        "Get Saved Spots Error: Invalid token or user not found.",
        userError
      );
      return res
        .status(401)
        .json({ error: "Invalid token or user not found." });
    }

    const { data, error } = await supabase
      .from("saved_spots")
      .select(
        `
        spot_id, 
        spots (
          id, 
          name, 
          description, 
          difficulty, 
          location, 
          image_url, 
          location_address, 
          created_at
        )
      `
      )
      .eq("user_id", user.id);

    if (error) {
      console.error("Get Saved Spots Error: Supabase select error.", error);
      return res.status(400).json({
        error: "Failed to retrieve saved spots.",
        details: error.message,
      });
    }
    // Transform data to return an array of spot objects directly
    const savedSpotsDetails = data ? data.map((s) => s.spots) : [];
    res.json(savedSpotsDetails);
  } catch (err) {
    console.error("Get Saved Spots Error: Server error.", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

// GET /api/spots/user/my-spots - Get all spots created by the current user
exports.getUserSpots = async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token =
    authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    console.error("Get User Spots Error: No token provided.");
    return res.status(401).json({ error: "User not authenticated." });
  }

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error(
        "Get User Spots Error: Invalid token or user not found.",
        userError
      );
      return res
        .status(401)
        .json({ error: "Invalid token or user not found." });
    }

    const { data, error } = await supabase
      .from("spots")
      .select("*") // Select all spot details
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }); // Optional: order by creation date

    if (error) {
      console.error("Get User Spots Error: Supabase select error.", error);
      return res.status(400).json({
        error: "Failed to retrieve user spots.",
        details: error.message,
      });
    }
    res.json(data);
  } catch (err) {
    console.error("Get User Spots Error: Server error.", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

// GET /api/spots/:spot_id/reviews - Get all reviews for a spot
exports.getSpotReviews = async (req, res) => {
  const { spot_id } = req.params;
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select(
        `
        id,
        comment,
        rating,
        created_at,
        user_id,
        profiles (
          full_name,
          avatar_url
        )
      `
      )
      .eq("spot_id", spot_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(`Error fetching reviews for spot ${spot_id}:`, error);
      return res
        .status(400)
        .json({ error: "Failed to retrieve reviews.", details: error.message });
    }
    res.json(data);
  } catch (err) {
    console.error(`Server error fetching reviews for spot ${spot_id}:`, err);
    res.status(500).json({ error: "Internal server error." });
  }
};

// POST /api/spots/:spot_id/reviews - Create a review for a spot
exports.createSpotReview = async (req, res) => {
  const { spot_id } = req.params;
  const { rating, comment } = req.body;
  const authHeader = req.headers["authorization"];
  const token =
    authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "User not authenticated." });
  }

  if (!rating || !comment) {
    return res.status(400).json({ error: "Rating and comment are required." });
  }
  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    return res
      .status(400)
      .json({ error: "Rating must be a number between 1 and 5." });
  }
  if (typeof comment !== "string" || comment.trim().length === 0) {
    return res.status(400).json({ error: "Comment cannot be empty." });
  }

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res
        .status(401)
        .json({ error: "Invalid token or user not found." });
    }

    // Check if the spot exists
    const { data: spotExists, error: spotCheckError } = await supabase
      .from("spots")
      .select("id")
      .eq("id", spot_id)
      .single();

    if (spotCheckError || !spotExists) {
      return res.status(404).json({ error: "Spot not found." });
    }

    const { data, error: reviewError } = await supabase
      .from("reviews")
      .insert([
        {
          spot_id: parseInt(spot_id),
          user_id: user.id,
          rating,
          comment: comment.trim(),
        },
      ])
      .select(
        `
        id,
        comment,
        rating,
        created_at,
        user_id,
        profiles (
          full_name,
          avatar_url
        )
      `
      );

    if (reviewError) {
      console.error(`Error creating review for spot ${spot_id}:`, reviewError);
      return res.status(400).json({
        error: "Failed to create review.",
        details: reviewError.message,
      });
    }
    res.status(201).json(data && data.length > 0 ? data[0] : {});
  } catch (err) {
    console.error(`Server error creating review for spot ${spot_id}:`, err);
    res.status(500).json({ error: "Internal server error." });
  }
};
