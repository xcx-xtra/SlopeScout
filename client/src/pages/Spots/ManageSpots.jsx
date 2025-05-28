import React, { useState, useEffect } from "react";
import supabase from "../../supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import LoadingSpinner from "../../components/LoadingSpinner";
import {
  FiEdit,
  FiTrash2,
  FiPlusSquare,
  FiEye,
  FiMapPin,
} from "react-icons/fi";

const ManageSpots = () => {
  const [userSpots, setUserSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCurrentUserAndSpots = async () => {
      setLoading(true);
      setError("");
      toast.dismiss();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        toast.warn(authError?.message || "Please log in to manage your spots.");
        navigate("/login");
        setLoading(false);
        return;
      }
      setCurrentUser(user);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setError("Authentication token not found. Please log in again.");
        toast.error("Authentication token not found. Please log in again.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:3001/api/spots/user/my-spots",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        if (response.ok) {
          setUserSpots(data);
        } else {
          throw new Error(data.error || "Failed to fetch user spots");
        }
      } catch (err) {
        console.error("Error fetching user spots:", err);
        setError(err.message || "Could not load your spots.");
        toast.error(err.message || "Could not load your spots.");
        setUserSpots([]);
      }
      setLoading(false);
    };

    fetchCurrentUserAndSpots();
  }, [navigate]);

  const handleDeleteSpot = async (spotId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this spot? This action cannot be undone."
      )
    ) {
      return;
    }
    toast.dismiss();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      toast.error("Authentication required. Please log in again.");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3001/api/spots/${spotId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const responseData = await response.json();
      if (response.ok) {
        toast.success(responseData.message || "Spot deleted successfully!");
        setUserSpots((prevSpots) =>
          prevSpots.filter((spot) => spot.id !== spotId)
        );
      } else {
        throw new Error(responseData.error || "Failed to delete spot");
      }
    } catch (err) {
      console.error("Error deleting spot:", err);
      toast.error(err.message || "Could not delete spot.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900">
        <LoadingSpinner text="Loading Your Spots..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-neutral-200 font-sans p-4 md:p-8">
      <div className="container mx-auto max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Manage Your Spots</h1>
          <Link
            to="/add-spot"
            className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors flex items-center"
          >
            <FiPlusSquare className="mr-2" /> Add New Spot
          </Link>
        </div>

        {error && (
          <div
            className="bg-red-800 border border-red-700 text-red-100 px-4 py-3 rounded-lg relative mb-6 shadow-lg"
            role="alert"
          >
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {userSpots.length === 0 && !error && (
          <div className="text-center bg-gray-800 p-8 rounded-lg shadow-xl">
            <FiMapPin className="mx-auto text-6xl text-gray-500 mb-4" />
            <h2 className="text-2xl font-semibold text-white mb-2">
              No Spots Created Yet
            </h2>
            <p className="text-neutral-400 mb-6">
              You haven't added any skate spots. Click "Add New Spot" to get
              started!
            </p>
          </div>
        )}

        {userSpots.length > 0 && (
          <div className="space-y-6">
            {userSpots.map((spot) => (
              <div
                key={spot.id}
                className="bg-gray-800 p-5 rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div>
                    <h2
                      className="text-xl font-semibold text-white truncate"
                      title={spot.name}
                    >
                      {spot.name}
                    </h2>
                    <p className="text-sm text-neutral-400">
                      Difficulty:{" "}
                      <span className="font-medium">
                        {spot.difficulty || "N/A"}
                      </span>
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Created: {new Date(spot.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                    <Link
                      to={`/spots/${spot.id}`}
                      title="View Spot"
                      className="text-primary-400 hover:text-primary-300 p-2 rounded-md hover:bg-gray-700 transition-colors"
                    >
                      <FiEye size={20} />
                    </Link>
                    <Link
                      to={`/spots/${spot.id}/edit`}
                      title="Edit Spot"
                      className="text-yellow-400 hover:text-yellow-300 p-2 rounded-md hover:bg-gray-700 transition-colors"
                    >
                      <FiEdit size={20} />
                    </Link>
                    <button
                      onClick={() => handleDeleteSpot(spot.id)}
                      title="Delete Spot"
                      className="text-red-500 hover:text-red-400 p-2 rounded-md hover:bg-gray-700 transition-colors"
                    >
                      <FiTrash2 size={20} />
                    </button>
                  </div>
                </div>
                {spot.description && (
                  <p className="text-sm text-neutral-300 mt-3 pt-3 border-t border-gray-700">
                    {spot.description.substring(0, 150)}
                    {spot.description.length > 150 ? "..." : ""}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageSpots;
