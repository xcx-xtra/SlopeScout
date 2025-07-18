import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import LoadingSpinner from "../../components/LoadingSpinner";
import supabase from "../../supabaseClient";
import { toast } from "react-toastify";

const SpotList = () => {
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState({
    difficulty: "",
    minElevation: "",
    maxElevation: "",
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [savedSpotIds, setSavedSpotIds] = useState(new Set());
  const [savingStates, setSavingStates] = useState({});
  const location = useLocation();

  // Effect for fetching the current user and listening to auth changes
  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setCurrentUser(session?.user ?? null);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Effect for fetching spots and saved spot IDs, dependent on currentUser and location.pathname
  useEffect(() => {
    const fetchSpotData = async () => {
      setLoading(true); // Set loading true at the beginning of data fetching
      setError("");
      toast.dismiss();

      try {
        // Fetch all spots
        const spotsRes = await fetch("http://localhost:3001/api/spots");
        const spotsData = await spotsRes.json();
        if (spotsRes.ok) {
          setSpots(spotsData);
        } else {
          setError(spotsData.error || "Error fetching spots");
          toast.error(spotsData.error || "Error fetching spots");
          setSpots([]); // Clear spots on error to avoid showing stale data
        }

        // Fetch user's saved spots if logged in
        if (currentUser) {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          const token = session?.access_token;
          if (token) {
            const savedRes = await fetch(
              `http://localhost:3001/api/spots/users/me/saved-spots`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (savedRes.ok) {
              const userSavedSpots = await savedRes.json();
              setSavedSpotIds(new Set(userSavedSpots.map((s) => s.id)));
            } else {
              console.error("Failed to fetch user's saved spots");
              setSavedSpotIds(new Set()); // Clear on error
            }
          } else {
            setSavedSpotIds(new Set()); // No token, clear saved spots
          }
        } else {
          setSavedSpotIds(new Set()); // No user, clear saved spots
        }
      } catch (error) {
        console.error("Network error:", error);
        setError("Network error fetching data");
        toast.error("Network error fetching data");
        setSpots([]); // Clear spots on network error
        setSavedSpotIds(new Set()); // Clear saved spots on network error
      } finally {
        setLoading(false); // Set loading false after all operations
      }
    };

    fetchSpotData();
  }, [location.pathname, currentUser]); // Re-fetch if path changes or user changes

  const handleToggleSaveSpot = async (spotId) => {
    if (!currentUser) {
      toast.error("You must be logged in to save spots.");
      return;
    }
    setSavingStates((prev) => ({ ...prev, [spotId]: true }));
    toast.dismiss();

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      toast.error("Authentication session not found. Please log in again.");
      setSavingStates((prev) => ({ ...prev, [spotId]: false }));
      return;
    }

    const isCurrentlySaved = savedSpotIds.has(spotId);
    const url = `http://localhost:3001/api/spots/${spotId}/${
      isCurrentlySaved ? "unsave" : "save"
    }`;
    const method = isCurrentlySaved ? "DELETE" : "POST";

    try {
      const res = await fetch(url, {
        method: method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const responseData = await res.json();

      if (res.ok) {
        setSavedSpotIds((prevIds) => {
          const newIds = new Set(prevIds);
          if (isCurrentlySaved) {
            newIds.delete(spotId);
          } else {
            newIds.add(spotId);
          }
          return newIds;
        });
        toast.success(
          responseData.message ||
            `Spot ${isCurrentlySaved ? "unsaved" : "saved"} successfully!`
        );
      } else {
        toast.error(
          responseData.error ||
            `Failed to ${isCurrentlySaved ? "unsave" : "save"} spot.`
        );
      }
    } catch (err) {
      console.error("Error toggling save spot:", err);
      toast.error(
        `Network error. Could not ${isCurrentlySaved ? "unsave" : "save"} spot.`
      );
    }
    setSavingStates((prev) => ({ ...prev, [spotId]: false }));
  };

  // Simple client-side filtering
  const filteredSpots = spots.filter((spot) => {
    let pass = true;
    // Name search (case-insensitive)
    if (
      searchTerm &&
      !spot.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      pass = false;
    }
    if (filter.difficulty && spot.difficulty !== filter.difficulty) {
      pass = false;
    }
    if (
      filter.minElevation &&
      spot.elevation_gain !== null && // Ensure elevation_gain is not null
      Number(spot.elevation_gain) < Number(filter.minElevation)
    ) {
      pass = false;
    }
    if (
      filter.maxElevation &&
      spot.elevation_gain !== null && // Ensure elevation_gain is not null
      Number(spot.elevation_gain) > Number(filter.maxElevation)
    ) {
      pass = false;
    }
    return pass;
  });

  // Conditional rendering based on loading, error, and data states
  if (loading) return <LoadingSpinner />;

  if (error)
    return (
      <div className="retro-spot-list">
        <div className="retro-spot-list-header">
          <h1 className="retro-spot-list-title">Explore Skate Spots</h1>
        </div>
        <div className="retro-empty-state">
          <div className="retro-empty-icon">⚠️</div>
          <h3 className="retro-empty-title">Error</h3>
          <p className="retro-empty-text">{error}</p>
        </div>
      </div>
    );

  return (
    <div className="retro-spot-list">
      <div className="retro-spot-list-header">
        <h1 className="retro-spot-list-title">Explore Skate Spots</h1>
      </div>

      {/* Filter and Search UI */}
      <div className="retro-filter-section">
        <div className="retro-filter-grid">
          <div className="retro-filter-group retro-filter-wide">
            <label htmlFor="searchTerm" className="retro-filter-label">
              Search by Name
            </label>
            <input
              id="searchTerm"
              type="text"
              className="retro-form-input"
              placeholder="E.g., Downtown Rail"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="retro-filter-group">
            <label htmlFor="difficulty" className="retro-filter-label">
              Difficulty
            </label>
            <select
              id="difficulty"
              className="retro-form-select"
              value={filter.difficulty}
              onChange={(e) =>
                setFilter((f) => ({ ...f, difficulty: e.target.value }))
              }
            >
              <option value="">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
          <div className="retro-filter-group">
            <label htmlFor="minElevation" className="retro-filter-label">
              Min Elevation (m)
            </label>
            <input
              id="minElevation"
              type="number"
              className="retro-form-input"
              placeholder="E.g., 0"
              value={filter.minElevation}
              onChange={(e) =>
                setFilter((f) => ({ ...f, minElevation: e.target.value }))
              }
            />
          </div>
          <div className="retro-filter-group">
            <label htmlFor="maxElevation" className="retro-filter-label">
              Max Elevation (m)
            </label>
            <input
              id="maxElevation"
              type="number"
              className="retro-form-input"
              placeholder="E.g., 100"
              value={filter.maxElevation}
              onChange={(e) =>
                setFilter((f) => ({ ...f, maxElevation: e.target.value }))
              }
            />
          </div>
        </div>
      </div>

      {filteredSpots.length === 0 && (
        <div className="retro-empty-state">
          <div className="retro-empty-icon">🛹</div>
          <h3 className="retro-empty-title">No Spots Found</h3>
          <p className="retro-empty-text">
            Try adjusting your search or filters, or be the first to{" "}
            <Link to="/add-spot" className="retro-link">
              add a new spot
            </Link>
            !
          </p>
        </div>
      )}
      {filteredSpots.length > 0 && (
        <div className="retro-spot-grid">
          {filteredSpots.map((spot) => (
            <div key={spot.id} className="retro-spot-card">
              <div className="retro-spot-content">
                <h2 className="retro-spot-title" title={spot.name}>
                  {spot.name}
                </h2>
                <div className="retro-spot-meta">
                  <span className="retro-spot-label">Difficulty:</span>{" "}
                  <span
                    className={`retro-difficulty-indicator ${
                      spot.difficulty === "Easy"
                        ? "retro-difficulty-easy"
                        : spot.difficulty === "Medium"
                        ? "retro-difficulty-medium"
                        : spot.difficulty === "Hard"
                        ? "retro-difficulty-hard"
                        : "retro-difficulty-unknown"
                    }`}
                  >
                    {spot.difficulty || "N/A"}
                  </span>
                </div>
                <div className="retro-spot-meta">
                  <span className="retro-spot-label">Elevation Gain:</span>{" "}
                  {spot.elevation_gain !== null
                    ? `${spot.elevation_gain}m`
                    : "N/A"}
                </div>
                <p className="retro-spot-description">
                  {spot.description || "No description available."}
                </p>
              </div>
              <div className="retro-spot-actions">
                <Link
                  to={`/spots/${spot.id}`}
                  className="retro-btn retro-btn-primary"
                >
                  View Details
                </Link>
                {currentUser && (
                  <button
                    onClick={() => handleToggleSaveSpot(spot.id)}
                    disabled={savingStates[spot.id]}
                    className={`retro-btn ${
                      savedSpotIds.has(spot.id)
                        ? "retro-btn-saved"
                        : "retro-btn-save"
                    }`}
                  >
                    {savingStates[spot.id] ? (
                      <div className="retro-loading-spinner retro-loading-sm"></div>
                    ) : savedSpotIds.has(spot.id) ? (
                      <>
                        <span className="retro-icon">❤️</span>
                        Unsave
                      </>
                    ) : (
                      <>
                        <span className="retro-icon">🤍</span>
                        Save
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SpotList;
