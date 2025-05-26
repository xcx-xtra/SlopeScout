import { useState } from "react";
import supabase from "../../supabaseClient";
import Map from "../../components/Map";

const AddSpot = ({ onAdd }) => {
  const [form, setForm] = useState({
    name: "",
    description: "",
    difficulty: "",
    elevation_gain: "",
    location: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [marker, setMarker] = useState(null);

  // Handle map click to set location
  const handleMapClick = (lngLat) => {
    setMarker(lngLat);
    setForm({ ...form, location: lngLat }); // store as object
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!user) {
      setError("You must be logged in to add a spot.");
      return;
    }
    // Ensure elevation_gain is a number and location is an object
    const spotData = {
      user_id: user.id,
      name: form.name,
      description: form.description,
      difficulty: form.difficulty,
      elevation_gain: form.elevation_gain ? Number(form.elevation_gain) : 0,
      location: marker ? { lng: marker.lng, lat: marker.lat } : null,
    };
    // Validate required fields
    if (
      !spotData.name ||
      !spotData.difficulty ||
      !spotData.elevation_gain ||
      !spotData.location
    ) {
      setError("Please fill out all required fields and select a location.");
      return;
    }
    // Send to backend with Authorization header if token is present
    try {
      const headers = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch("http://localhost:3001/api/spots", {
        method: "POST",
        headers,
        body: JSON.stringify(spotData),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Spot submitted!");
        setForm({
          name: "",
          description: "",
          difficulty: "",
          elevation_gain: "",
          location: "",
        });
        setMarker(null);
        if (onAdd) onAdd(data);
      } else {
        setError(data.error || "Error submitting spot");
      }
    } catch (err) {
      setError("Network error");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto p-4 bg-white rounded shadow my-8"
    >
      <h2 className="text-xl font-bold mb-4">Add Spot</h2>
      <input
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder="Name"
        className="block w-full mb-2 p-2 border rounded"
      />
      <input
        name="description"
        value={form.description}
        onChange={handleChange}
        placeholder="Description"
        className="block w-full mb-2 p-2 border rounded"
      />
      <input
        name="difficulty"
        value={form.difficulty}
        onChange={handleChange}
        placeholder="Difficulty"
        className="block w-full mb-2 p-2 border rounded"
      />
      <input
        name="elevation_gain"
        value={form.elevation_gain}
        onChange={handleChange}
        placeholder="Elevation Gain"
        className="block w-full mb-2 p-2 border rounded"
      />
      <div className="mb-2">
        <label className="block mb-1">Click on the map to set location:</label>
        <Map onMapClick={handleMapClick} marker={marker} />
        {marker && (
          <div className="text-sm mt-1">
            Location: {marker.lng.toFixed(5)}, {marker.lat.toFixed(5)}
          </div>
        )}
      </div>
      {error && (
        <div className="text-red-500 mb-2">
          {typeof error === "object"
            ? error.error && typeof error.error === "string"
              ? error.error
              : JSON.stringify(error.error || error, null, 2)
            : error}
        </div>
      )}
      {success && <div className="text-green-500 mb-2">{success}</div>}
      <button
        className="w-full bg-green-600 text-white p-2 rounded"
        type="submit"
      >
        Add Spot
      </button>
    </form>
  );
};
export default AddSpot;
