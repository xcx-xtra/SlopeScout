import Map from "../../components/Map";
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import supabase from "../../supabaseClient"; // Import supabase client
import { toast } from "react-toastify"; // Import toast
import LoadingSpinner from "../../components/LoadingSpinner"; // Import LoadingSpinner

const SpotDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [spot, setSpot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchSpotAndUserData = async () => {
      setLoading(true);
      setError("");

      // Fetch current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);

      try {
        const res = await fetch(`http://localhost:3001/api/spots/${id}`);
        const data = await res.json();
        if (res.ok) {
          setSpot(data);
          if (user && data) {
            // Check if spot is saved by this user
            checkIfSaved(data.id, user.id);
          }
        } else {
          setError(data.error || "Error fetching spot");
          toast.error(data.error || "Error fetching spot");
        }
      } catch (err) {
        setError("Network error");
        toast.error("Network error while fetching spot.");
      }
      setLoading(false);
    };

    const checkIfSaved = async (spotId, userId) => {
      // This is a simplified check. Ideally, fetch all saved spots for the user once
      // and check against that list, or have a dedicated endpoint.
      // For now, we'll assume a direct check is okay for demonstration.
      // This requires a backend endpoint like GET /api/users/:userId/saved-spots/:spotId
      // or fetching all saved spots and filtering client-side.
      // Let's adapt to use the new getSavedSpots endpoint and filter client-side for now.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) return;

      try {
        const res = await fetch(
          `http://localhost:3001/api/spots/users/me/saved-spots`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (res.ok) {
          const savedSpots = await res.json();
          const isSpotSaved = savedSpots.some(
            (savedSpot) => savedSpot.id === parseInt(spotId)
          );
          setIsSaved(isSpotSaved);
        }
      } catch (err) {
        console.error("Error checking if spot is saved:", err);
        // Don't toast an error here, as it might be too noisy
      }
    };

    fetchSpotAndUserData();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this spot?")) return;
    setDeleting(true);
    setError(""); // Clear previous errors
    toast.dismiss();

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!currentUser || !token) {
      setError("You must be logged in to delete a spot.");
      toast.error("You must be logged in to delete a spot.");
      setDeleting(false);
      return;
    }

    try {
      const res = await fetch(`http://localhost:3001/api/spots/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`, // Send token for RLS
        },
      });
      if (res.ok) {
        toast.success("Spot deleted successfully!");
        navigate("/spots");
      } else {
        const data = await res.json();
        setError(data.error || "Error deleting spot");
        toast.error(data.error || "Error deleting spot");
      }
    } catch (err) {
      setError("Network error");
      toast.error("Network error while deleting spot.");
    }
    setDeleting(false);
  };

  const handleToggleSaveSpot = async () => {
    if (!currentUser) {
      toast.error("You must be logged in to save spots.");
      return;
    }
    setSaving(true);
    toast.dismiss();

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      toast.error("Authentication session not found. Please log in again.");
      setSaving(false);
      return;
    }

    const url = `http://localhost:3001/api/spots/${spot.id}/${
      isSaved ? "unsave" : "save"
    }`;
    const method = isSaved ? "DELETE" : "POST";

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
        setIsSaved(!isSaved);
        toast.success(
          responseData.message ||
            `Spot ${isSaved ? "unsaved" : "saved"} successfully!`
        );
      } else {
        toast.error(
          responseData.error || `Failed to ${isSaved ? "unsave" : "save"} spot.`
        );
      }
    } catch (err) {
      console.error("Error toggling save spot:", err);
      toast.error(
        `Network error. Could not ${isSaved ? "unsave" : "save"} spot.`
      );
    }
    setSaving(false);
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <LoadingSpinner text="Loading spot details..." />
      </div>
    );
  if (error && !spot)
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md"
          role="alert"
        >
          <p className="font-bold">Error</p>
          <p>{error}. Please try refreshing the page.</p>
        </div>
      </div>
    );
  if (!spot)
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-center">
        <div className="bg-neutral-100 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-neutral-700">
            Spot Not Found
          </h2>
          <p className="text-neutral-500 mt-2">
            The spot you are looking for does not exist or may have been
            removed.
          </p>
          <Link
            to="/spots"
            className="mt-4 inline-block bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Back to Spots
          </Link>
        </div>
      </div>
    );

  let marker = null;
  try {
    marker = spot.location ? JSON.parse(spot.location) : null;
  } catch {
    marker = null;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-sans">
      <div className="flex flex-col lg:flex-row lg:gap-8">
        {/* Details Section */}
        <div className="lg:w-1/2 bg-white shadow-xl rounded-xl p-6 sm:p-8 mb-6 lg:mb-0">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary-dark mb-3 font-serif">
            {spot.name}
          </h2>
          <div className="space-y-4 text-neutral-700">
            <div>
              <strong className="block text-sm font-medium text-neutral-500 mb-1">
                Description:
              </strong>
              <p className="text-neutral-800 whitespace-pre-wrap break-words bg-neutral-50 p-3 rounded-md border border-neutral-200">
                {spot.description || (
                  <span className="italic text-neutral-400">
                    No description provided.
                  </span>
                )}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <strong className="block text-sm font-medium text-neutral-500">
                  Difficulty:
                </strong>
                <span
                  className={`font-semibold text-lg ${
                    spot.difficulty === "Easy"
                      ? "text-green-500"
                      : spot.difficulty === "Medium"
                      ? "text-amber-500"
                      : spot.difficulty === "Hard"
                      ? "text-red-600"
                      : "text-neutral-600"
                  }`}
                >
                  {spot.difficulty || "N/A"}
                </span>
              </div>
              <div>
                <strong className="block text-sm font-medium text-neutral-500">
                  Elevation Gain:
                </strong>
                <span className="text-neutral-800 text-lg">
                  {spot.elevation_gain !== null
                    ? `${spot.elevation_gain}m`
                    : "N/A"}
                </span>
              </div>
            </div>
            {spot.location &&
            typeof spot.location === "object" &&
            spot.location.lat &&
            spot.location.lng ? (
              <div>
                <strong className="block text-sm font-medium text-neutral-500">
                  Location (Lat, Lng):
                </strong>
                <span className="text-neutral-800 text-sm">
                  {spot.location.lat?.toFixed(5)},{" "}
                  {spot.location.lng?.toFixed(5)}
                </span>
              </div>
            ) : (
              <div>
                <strong className="block text-sm font-medium text-neutral-500">
                  Location:
                </strong>
                <span className="text-neutral-800 text-sm">
                  {spot.location || (
                    <span className="italic text-neutral-400">
                      Not specified.
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 pt-6 border-t border-neutral-200 flex flex-col sm:flex-row sm:space-x-3 space-y-3 sm:space-y-0">
            {currentUser && spot && spot.user_id === currentUser.id && (
              <>
                <button
                  className="w-full sm:w-auto flex-1 bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-opacity-50 flex items-center justify-center"
                  onClick={() => navigate(`/spots/${id}/edit`)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                    <path
                      fillRule="evenodd"
                      d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Edit Spot
                </button>
                <button
                  className="w-full sm:w-auto flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50 flex items-center justify-center"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <LoadingSpinner size="sm" color="text-white" />{" "}
                      Deleting...
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Delete Spot
                    </>
                  )}
                </button>
              </>
            )}
            {currentUser && spot && (
              <button
                className={`w-full sm:w-auto flex-1 font-semibold py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out focus:outline-none focus:ring-opacity-50 flex items-center justify-center ${
                  isSaved
                    ? "bg-secondary hover:bg-secondary-dark text-white focus:ring-2 focus:ring-pink-400"
                    : "bg-accent-500 hover:bg-accent-600 text-white focus:ring-2 focus:ring-amber-400"
                }`}
                onClick={handleToggleSaveSpot}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <LoadingSpinner size="sm" color="text-white" />{" "}
                    {isSaved ? "Unsaving..." : "Saving..."}
                  </>
                ) : isSaved ? (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Unsave Spot
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
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
                    Save Spot
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Map Section */}
        {marker && (
          <div className="lg:w-1/2 mt-6 lg:mt-0 h-[300px] sm:h-[400px] md:h-[500px] lg:h-auto rounded-xl shadow-xl overflow-hidden border-4 border-white">
            <Map
              marker={marker}
              interactive={false}
              spots={spot ? [spot] : []}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SpotDetail;
