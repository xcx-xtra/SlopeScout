import React, { useState, useEffect } from "react";
import supabase from "../supabaseClient"; // Corrected path
import LoadingSpinner from "../components/LoadingSpinner"; // Corrected path
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate
import { toast } from "react-toastify";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [userSpots, setUserSpots] = useState([]);
  const [savedSpots, setSavedSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError("");
      toast.dismiss();

      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        setError(userError.message);
        toast.error(userError.message);
        setLoading(false);
        return;
      }
      if (!currentUser) {
        setError("No user logged in. Redirecting to login...");
        toast.warn("Please log in to view your profile.");
        setLoading(false);
        navigate("/login"); // Redirect to login if no user
        return;
      }
      setUser(currentUser);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Fetch user-created spots
      try {
        const { data: createdSpots, error: createdError } = await supabase
          .from("spots")
          .select("*")
          .eq("user_id", currentUser.id);
        if (createdError) throw createdError;
        setUserSpots(createdSpots || []);
      } catch (e) {
        console.error("Error fetching user spots:", e);
        setError((prev) => prev + "\nError fetching created spots.");
        toast.error("Could not fetch your created spots.");
      }

      // Fetch saved/bookmarked spots
      if (token) {
        try {
          const res = await fetch(
            `http://localhost:3001/api/spots/users/me/saved-spots`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(
              errData.error || "Failed to fetch saved spots from backend"
            );
          }
          const userSavedSpots = await res.json();
          setSavedSpots(userSavedSpots || []);
        } catch (e) {
          console.error("Error fetching saved spots:", e);
          setError((prev) => prev + "\nError fetching saved spots.");
          toast.error(e.message || "Could not fetch your saved spots.");
        }
      }
      setLoading(false);
    };

    fetchUserData();
  }, [navigate]);

  const handleDeleteSpot = async (spotId) => {
    if (!window.confirm("Are you sure you want to delete this spot?")) return;

    toast.dismiss();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      toast.error("Authentication required to delete.");
      return;
    }

    try {
      const res = await fetch(`http://localhost:3001/api/spots/${spotId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        toast.success("Spot deleted successfully!");
        setUserSpots((prevSpots) =>
          prevSpots.filter((spot) => spot.id !== spotId)
        );
        // Also remove from saved spots if it was there, though less critical here
        setSavedSpots((prevSpots) =>
          prevSpots.filter((spot) => spot.id !== spotId)
        );
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to delete spot.");
      }
    } catch (err) {
      console.error("Error deleting spot:", err);
      toast.error("Network error while deleting spot.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-neutral-100">
        <LoadingSpinner text="Loading profile..." />
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="container mx-auto p-6 py-12 text-center bg-neutral-50 rounded-lg shadow-xl">
        <h2 className="text-2xl font-semibold text-red-600 mb-4">
          Profile Error
        </h2>
        <p className="text-neutral-700 mb-2">
          There was an issue loading your profile: {error}
        </p>
        <p className="text-neutral-600 mb-6">
          Please try logging out and logging back in, or refresh the page.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="px-6 py-2 bg-primary-DEFAULT hover:bg-primary-dark text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-0.5"
        >
          Go to Login
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-neutral-100">
        <p className="text-neutral-600 mr-2">Redirecting to login...</p>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 to-neutral-200 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="container mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-neutral-800 tracking-tight">
            My Profile
          </h1>
          <p className="mt-2 text-lg text-neutral-600">
            Manage your spots and account details.
          </p>
        </header>

        {/* Account Details Card */}
        <div className="bg-white shadow-2xl rounded-xl p-6 sm:p-8 mb-10 transform hover:scale-105 transition-transform duration-300 ease-out">
          <h2 className="text-2xl font-semibold mb-4 text-primary-dark border-b-2 border-primary-light pb-2">
            Account Details
          </h2>
          <div className="space-y-3">
            <p className="text-neutral-700 text-lg">
              <strong className="font-medium text-neutral-800">Email:</strong>{" "}
              {user.email}
            </p>
            {/* Placeholder for future details */}
            {/* <p className="text-neutral-700">
              <strong className="font-medium text-neutral-800">Username:</strong> {user.username || "Not set"}
            </p> */}
            <button
              onClick={async () => {
                const { error } = await supabase.auth.signOut();
                if (error) {
                  toast.error("Failed to log out: " + error.message);
                } else {
                  toast.success("Logged out successfully!");
                  navigate("/login");
                }
              }}
              className="mt-4 px-5 py-2 bg-secondary-DEFAULT hover:bg-secondary-dark text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-secondary-light focus:ring-opacity-75"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Created Spots Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 text-neutral-700">
            My Created Spots{" "}
            <span className="text-primary-DEFAULT">({userSpots.length})</span>
          </h2>
          {userSpots.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {userSpots.map((spot) => (
                <div
                  key={spot.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ease-in-out flex flex-col"
                >
                  <div className="p-5 sm:p-6 flex-grow">
                    <Link
                      to={`/spots/${spot.id}`}
                      className="block text-xl font-semibold text-primary-DEFAULT hover:text-primary-dark transition-colors duration-200 truncate"
                    >
                      {spot.name}
                    </Link>
                    <p className="text-neutral-600 mt-2 text-sm leading-relaxed h-20 overflow-hidden relative group">
                      {spot.description?.substring(0, 120) ||
                        "No description provided."}
                      {spot.description && spot.description.length > 120 && (
                        <span className="text-primary-light group-hover:text-primary-DEFAULT">
                          ... more
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="bg-neutral-50 p-4 sm:p-5 border-t border-neutral-200">
                    <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                      <Link
                        to={`/spots/${spot.id}/edit`}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-center bg-accent-500 hover:bg-accent-600 text-white rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:ring-opacity-75"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteSpot(spot.id)}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 px-6 bg-white rounded-xl shadow-lg border-2 border-dashed border-neutral-300">
              <svg
                className="mx-auto h-16 w-16 text-neutral-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v3m0 0v3m0-3h3m-3 0H9m12-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-xl font-semibold text-neutral-700 mb-2">
                No Created Spots Yet
              </h3>
              <p className="text-neutral-500 mb-6">
                Ready to map out your favorite terrains?
              </p>
              <Link
                to="/add-spot"
                className="inline-flex items-center px-6 py-3 border border-transparent shadow-md text-base font-medium rounded-lg text-white bg-primary-DEFAULT hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light transition-all duration-300 ease-in-out transform hover:-translate-y-0.5"
              >
                Create Your First Spot!
              </Link>
            </div>
          )}
        </section>

        {/* Saved Spots Section */}
        <section>
          <h2 className="text-3xl font-semibold mb-6 text-neutral-700">
            My Saved Spots{" "}
            <span className="text-secondary-DEFAULT">
              ({savedSpots.length})
            </span>
          </h2>
          {savedSpots.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {savedSpots.map((spot) => (
                <div
                  key={spot.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ease-in-out flex flex-col"
                >
                  <div className="p-5 sm:p-6 flex-grow">
                    <Link
                      to={`/spots/${spot.id}`}
                      className="block text-xl font-semibold text-secondary-DEFAULT hover:text-secondary-dark transition-colors duration-200 truncate"
                    >
                      {spot.name}
                    </Link>
                    <p className="text-neutral-600 mt-2 text-sm leading-relaxed h-20 overflow-hidden relative group">
                      {spot.description?.substring(0, 120) ||
                        "No description available."}
                      {spot.description && spot.description.length > 120 && (
                        <span className="text-secondary-light group-hover:text-secondary-DEFAULT">
                          ... more
                        </span>
                      )}
                    </p>
                    {/* Consider adding an Unsave button here if UX allows */}
                  </div>
                  <div className="bg-neutral-50 p-4 sm:p-5 border-t border-neutral-200 text-right">
                    <Link
                      to={`/spots/${spot.id}`}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-center bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-opacity-75"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 px-6 bg-white rounded-xl shadow-lg border-2 border-dashed border-neutral-300">
              <svg
                className="mx-auto h-16 w-16 text-neutral-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v1h2a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H7a2 2 0 01-2-2v-1H4a1 1 0 01-1-1V6a1 1 0 011-1h2V5zM5 19a2 2 0 012-2h10a2 2 0 012 2"
                />
              </svg>
              <h3 className="text-xl font-semibold text-neutral-700 mb-2">
                No Saved Spots Yet
              </h3>
              <p className="text-neutral-500 mb-6">
                Explore and save spots that catch your eye!
              </p>
              <Link
                to="/spots"
                className="inline-flex items-center px-6 py-3 border border-transparent shadow-md text-base font-medium rounded-lg text-white bg-secondary-DEFAULT hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-light transition-all duration-300 ease-in-out transform hover:-translate-y-0.5"
              >
                Explore Spots
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Profile;
