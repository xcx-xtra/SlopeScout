import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const SpotList = () => {
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState({
    difficulty: "",
    minElevation: "",
    maxElevation: "",
  });

  useEffect(() => {
    const fetchSpots = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("http://localhost:3001/api/spots");
        const data = await res.json();
        if (res.ok) setSpots(data);
        else setError(data.error || "Error fetching spots");
      } catch (err) {
        setError("Network error");
      }
      setLoading(false);
    };
    fetchSpots();
  }, []);

  // Simple client-side filtering
  const filteredSpots = spots.filter((spot) => {
    let pass = true;
    if (filter.difficulty && spot.difficulty !== filter.difficulty)
      pass = false;
    if (
      filter.minElevation &&
      Number(spot.elevation_gain) < Number(filter.minElevation)
    )
      pass = false;
    if (
      filter.maxElevation &&
      Number(spot.elevation_gain) > Number(filter.maxElevation)
    )
      pass = false;
    return pass;
  });

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">All Spots</h2>
      <div className="mb-4 flex gap-2">
        <input
          className="p-2 border rounded"
          placeholder="Difficulty"
          value={filter.difficulty}
          onChange={(e) =>
            setFilter((f) => ({ ...f, difficulty: e.target.value }))
          }
        />
        <input
          className="p-2 border rounded"
          placeholder="Min Elevation"
          type="number"
          value={filter.minElevation}
          onChange={(e) =>
            setFilter((f) => ({ ...f, minElevation: e.target.value }))
          }
        />
        <input
          className="p-2 border rounded"
          placeholder="Max Elevation"
          type="number"
          value={filter.maxElevation}
          onChange={(e) =>
            setFilter((f) => ({ ...f, maxElevation: e.target.value }))
          }
        />
      </div>
      {loading && <div>Loading spots...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {!loading && !filteredSpots.length && <div>No spots found.</div>}
      <ul>
        {filteredSpots.map((spot) => (
          <li key={spot.id} className="mb-2 p-2 border rounded">
            <Link
              to={`/spots/${spot.id}`}
              className="text-blue-600 hover:underline"
            >
              {spot.name}{" "}
              {spot.location && (
                <span className="text-xs">({spot.location})</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SpotList;
