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
  const { ...fields } = req.body;
  const { data, error } = await supabase
    .from("spots")
    .update(fields)
    .eq("id", id)
    .select();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

// DELETE /api/spots/:id - Delete
exports.deleteSpot = async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from("spots").delete().eq("id", id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
};
