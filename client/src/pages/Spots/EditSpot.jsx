import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import supabase from "../../supabaseClient";
import Map from "../../components/Map";

const EditSpot = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    description: "",
    difficulty: "",
    elevation_gain: "",
    location: "",
  });
  const [marker, setMarker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchSpot = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`http://localhost:3001/api/spots/${id}`);
        const data = await res.json();
        if (res.ok && data) {
          setForm({
            name: data.name || "",
            description: data.description || "",
            difficulty: data.difficulty || "",
            elevation_gain: data.elevation_gain || "",
            location: data.location || "",
          });
          try {
            setMarker(data.location ? JSON.parse(data.location) : null);
          } catch {
            setMarker(null);
          }
        } else setError(data.error || "Error fetching spot");
      } catch (err) {
        setError("Network error");
      }
      setLoading(false);
    };
    fetchSpot();
  }, [id]);

  const handleMapClick = (lngLat) => {
    setMarker(lngLat);
    setForm({ ...form, location: JSON.stringify(lngLat) });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    // Optionally, check user ownership here
    try {
      const res = await fetch(`http://localhost:3001/api/spots/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Spot updated!");
        navigate(`/spots/${id}`);
      } else {
        setError(data.error || "Error updating spot");
      }
    } catch (err) {
      setError("Network error");
    }
  };

  if (loading) return <div className="p-4">Loading spot...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto p-4 bg-white rounded shadow my-8"
    >
      <h2 className="text-xl font-bold mb-4">Edit Spot</h2>
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
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {success && <div className="text-green-500 mb-2">{success}</div>}
      <button
        className="w-full bg-blue-600 text-white p-2 rounded"
        type="submit"
      >
        Update Spot
      </button>
    </form>
  );
};

export default EditSpot;
