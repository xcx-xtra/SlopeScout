import Map from "../../components/Map";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const SpotDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [spot, setSpot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchSpot = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`http://localhost:3001/api/spots/${id}`);
        const data = await res.json();
        if (res.ok) setSpot(data);
        else setError(data.error || "Error fetching spot");
      } catch (err) {
        setError("Network error");
      }
      setLoading(false);
    };
    fetchSpot();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this spot?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`http://localhost:3001/api/spots/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        navigate("/spots");
      } else {
        const data = await res.json();
        setError(data.error || "Error deleting spot");
      }
    } catch (err) {
      setError("Network error");
    }
    setDeleting(false);
  };

  if (loading) return <div className="p-4">Loading spot...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!spot) return <div className="p-4">Spot not found.</div>;

  let marker = null;
  try {
    marker = spot.location ? JSON.parse(spot.location) : null;
  } catch {
    marker = null;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-2">{spot.name}</h2>
      <div className="mb-2">Description: {spot.description}</div>
      <div className="mb-2">Difficulty: {spot.difficulty}</div>
      <div className="mb-2">Elevation Gain: {spot.elevation_gain}</div>
      <div className="mb-2">Location: {spot.location}</div>
      {marker && (
        <div className="my-4">
          <Map marker={marker} />
        </div>
      )}
      <button
        className="bg-red-600 text-white px-4 py-2 rounded mr-2"
        onClick={handleDelete}
        disabled={deleting}
      >
        {deleting ? "Deleting..." : "Delete"}
      </button>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded"
        onClick={() => navigate(`/spots/${id}/edit`)}
      >
        Edit
      </button>
    </div>
  );
};

export default SpotDetail;
