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
      } catch (err) {
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
      <div className="container mx-auto p-4 font-sans">
        <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center text-primary-dark font-serif">
          Explore Skate Spots
        </h1>
        <div className="text-center text-red-500 bg-red-100 p-4 rounded-lg shadow">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      </div>
    );

  return (
    <div className="container mx-auto p-4 font-sans">
      <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center text-primary-dark font-serif">
        Explore Skate Spots
      </h1>

      {/* Filter and Search UI */}
      <div className="mb-8 p-4 sm:p-6 bg-neutral-100 rounded-xl shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <label
              htmlFor="searchTerm"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Search by Name
            </label>
            <input
              id="searchTerm"
              type="text"
              className="p-3 border border-neutral-300 rounded-lg w-full focus:ring-primary focus:border-primary shadow-sm text-sm"
              placeholder="E.g., Downtown Rail"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="difficulty"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Difficulty
            </label>
            <select
              id="difficulty"
              className="p-3 border border-neutral-300 rounded-lg w-full focus:ring-primary focus:border-primary shadow-sm text-sm bg-white"
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
          <div>
            <label
              htmlFor="minElevation"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Min Elevation (m)
            </label>
            <input
              id="minElevation"
              type="number"
              className="p-3 border border-neutral-300 rounded-lg w-full focus:ring-primary focus:border-primary shadow-sm text-sm"
              placeholder="E.g., 0"
              value={filter.minElevation}
              onChange={(e) =>
                setFilter((f) => ({ ...f, minElevation: e.target.value }))
              }
            />
          </div>
          <div>
            <label
              htmlFor="maxElevation"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Max Elevation (m)
            </label>
            <input
              id="maxElevation"
              type="number"
              className="p-3 border border-neutral-300 rounded-lg w-full focus:ring-primary focus:border-primary shadow-sm text-sm"
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
        <div className="text-center py-10 px-4 bg-white rounded-lg shadow-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mx-auto h-12 w-12 text-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-neutral-800">
            No Spots Found
          </h3>
          <p className="mt-1 text-sm text-neutral-600">
            Try adjusting your search or filters, or be the first to{" "}
            <Link
              to="/add-spot"
              className="text-primary hover:text-primary-dark font-semibold"
            >
              add a new spot
            </Link>
            !
          </p>
        </div>
      )}
      {filteredSpots.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpots.map((spot) => (
            <div
              key={spot.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-2xl flex flex-col"
            >
              <div className="p-5 flex-grow">
                <h2
                  className="text-xl font-semibold text-primary-dark mb-2 truncate"
                  title={spot.name}
                >
                  {spot.name}
                </h2>
                <p className="text-sm text-neutral-600 mb-1">
                  <span className="font-medium">Difficulty:</span>{" "}
                  <span
                    className={`font-bold ${
                      spot.difficulty === "Easy"
                        ? "text-green-500"
                        : spot.difficulty === "Medium"
                        ? "text-amber-500"
                        : spot.difficulty === "Hard"
                        ? "text-red-600"
                        : "text-neutral-500"
                    }`}
                  >
                    {spot.difficulty || "N/A"}
                  </span>
                </p>
                <p className="text-sm text-neutral-600 mb-3">
                  <span className="font-medium">Elevation Gain:</span>{" "}
                  {spot.elevation_gain !== null
                    ? `${spot.elevation_gain}m`
                    : "N/A"}
                </p>
                <p className="text-xs text-neutral-500 mb-3 h-10 overflow-hidden">
                  {spot.description || "No description available."}
                </p>
              </div>
              <div className="p-5 bg-neutral-50 border-t border-neutral-200 flex flex-col sm:flex-row justify-between items-center gap-2">
                <Link
                  to={`/spots/${spot.id}`}
                  className="text-sm text-white bg-primary hover:bg-primary-dark font-medium py-2 px-4 rounded-lg transition-colors w-full sm:w-auto text-center shadow-sm hover:shadow-md"
                >
                  View Details
                </Link>
                {currentUser && (
                  <button
                    onClick={() => handleToggleSaveSpot(spot.id)}
                    disabled={savingStates[spot.id]}
                    className={`text-sm font-medium py-2 px-4 rounded-lg transition-colors w-full sm:w-auto text-center shadow-sm hover:shadow-md flex items-center justify-center ${
                      savedSpotIds.has(spot.id)
                        ? "bg-secondary hover:bg-secondary-dark text-white"
                        : "bg-neutral-200 hover:bg-neutral-300 text-neutral-700"
                    }`}
                  >
                    {savingStates[spot.id] ? (
                      <LoadingSpinner size="sm" />
                    ) : savedSpotIds.has(spot.id) ? (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-1.5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Unsave
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-1.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
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
