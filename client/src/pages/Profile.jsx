import React, { useState, useEffect } from "react";
import supabase from "../supabaseClient";
import LoadingSpinner from "../components/LoadingSpinner";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiUser,
  FiMapPin,
  FiTrendingUp,
  FiClock,
  FiStar,
  FiChevronRight,
  FiSettings,
  FiEdit,
  FiLogOut,
  FiHeart,
  FiGrid,
  FiList,
  FiImage,
  FiCalendar,
  FiChevronsRight,
  FiShare2, // Example for a potential future icon
  FiMessageSquare, // Example
} from "react-icons/fi";

const defaultAvatar = "/default-avatar.png"; // Or a more appropriate placeholder image path or URL

const Profile = () => {
  const [user, setUser] = useState(null); // Stores Supabase auth user
  const [profileData, setProfileData] = useState(null); // Stores data from your 'profiles' table
  const [rideHistory, setRideHistory] = useState([]); // Stores ride history
  const [favoriteSpots, setFavoriteSpots] = useState([]); // Stores favorite spots
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfilePageData = async () => {
      setLoading(true);
      setError("");
      toast.dismiss();

      const {
        data: { user: currentUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !currentUser) {
        toast.warn(authError?.message || "Please log in to view your profile.");
        navigate("/login");
        setLoading(false);
        return;
      }
      setUser(currentUser);

      // --- Fetch Profile Details (from 'profiles') ---
      try {
        let profileDataToUpdate = null; // Will hold the profile data to be updated

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();

        if (profileError) {
          if (
            profileError.code === "PGRST116" &&
            profileError.details?.includes("0 rows")
          ) {
            console.warn(
              "No profile found for user (PGRST116 with .single()):",
              currentUser.id
            );
            setError("Profile not found. Please complete your profile.");
            profileDataToUpdate = {
              // Assign to temporary variable
              bio: "",
              avatar_url: defaultAvatar,
              full_name: currentUser?.email?.split("@")[0] || "Skater",
              total_rides: 0, // Placeholder, will be updated by ride history
              total_distance_km: 0, // Placeholder, will be updated
              location: "",
            };
          } else if (
            profileError.code === "PGRST116" &&
            profileError.message.includes("Could not find a representation")
          ) {
            console.error(
              "Profile fetch error (406 Not Acceptable):",
              profileError.message
            );
            setError(
              "Could not retrieve profile information. The requested data format might not be available or the resource does not exist as expected."
            );
            // No specific profileDataToUpdate here, error state will be shown
          } else if (profileError.code === "PGRST204") {
            console.warn("No profile found for user:", currentUser.id);
            setError("Profile not found. Please complete your profile.");
            profileDataToUpdate = {
              // Assign to temporary variable
              bio: "",
              avatar_url: defaultAvatar,
              full_name: currentUser?.email?.split("@")[0] || "Skater",
              total_rides: 0, // Placeholder
              total_distance_km: 0, // Placeholder
              location: "",
            };
          } else {
            throw profileError;
          }
        } else if (profile) {
          profileDataToUpdate = {
            // Assign to temporary variable
            ...profile,
            avatar_url: profile.avatar_url || defaultAvatar,
            total_rides: profile.total_rides || 0, // Use DB value or placeholder
            total_distance_km: profile.total_distance_km || 0, // Use DB value or placeholder
          };
        } else {
          console.warn(
            "No profile data returned for user:",
            currentUser.id,
            "although no explicit error was thrown."
          );
          setError("Profile data is missing. Please complete your profile.");
          profileDataToUpdate = {
            // Assign to temporary variable
            bio: "",
            avatar_url: defaultAvatar,
            full_name: currentUser?.email?.split("@")[0] || "Skater",
            total_rides: 0, // Placeholder
            total_distance_km: 0, // Placeholder
            location: "",
          };
        }

        if (profileDataToUpdate) {
          setProfileData(profileDataToUpdate); // Set profile data first
        }
      } catch (error) {
        console.error("Error fetching profile details:", error);
        setError(
          `Failed to fetch profile details: ${error.message}. Please check console for more.`
        );
        setProfileData({
          // Set fallback profile data
          bio: "Bio not available.",
          avatar_url: defaultAvatar,
          full_name: currentUser?.email?.split("@")[0] || "Skater",
          total_rides: 0, // Placeholder
          total_distance_km: 0, // Placeholder
          location: "Not set",
        });
      }

      // --- Fetch Ride History (from 'ride_history' table) ---
      // This section is now placed after profile fetch, and will update profileData
      // with calculated ride stats.
      try {
        const { data: rides, error: ridesError } = await supabase
          .from("ride_history")
          .select(
            "id, name, ride_date, distance_km, duration_min, spot_id, notes"
          )
          .eq("user_id", currentUser.id)
          .order("ride_date", { ascending: false })
          .limit(10);

        if (ridesError) throw ridesError;
        setRideHistory(rides || []);

        // Calculate total_rides and total_distance_km from rideHistory
        // and update the profileData state
        setProfileData((prevProfileData) => {
          const calculatedTotalRides = rides ? rides.length : 0;
          const calculatedTotalDistance = rides
            ? rides.reduce((sum, ride) => sum + (ride.distance_km || 0), 0)
            : 0;
          return {
            ...(prevProfileData || {
              // Ensure prevProfileData is at least an empty object
              bio: "", // Default bio if not set
              avatar_url: defaultAvatar, // Default avatar if not set
              full_name: currentUser?.email?.split("@")[0] || "Skater", // Default name
              location: "", // Default location
            }),
            total_rides: calculatedTotalRides,
            total_distance_km: parseFloat(calculatedTotalDistance.toFixed(2)),
          };
        });
      } catch (e) {
        console.error("Error fetching ride history:", e);
        setError(
          (prev) => (prev ? prev + "\n" : "") + "Could not load ride history."
        );
        toast.error("Could not load ride history: " + e.message);
        setRideHistory([]); // Set to empty array on error
      }

      // --- Fetch Favorite Spots (from 'saved_spots' join 'spots') ---
      try {
        const { data: saved, error: savedError } = await supabase
          .from("saved_spots")
          .select(
            `
            spot_id,
            spots (
              id,
              name,
              description,
              difficulty,
              location_address,
              created_at
            )
          `
          )
          .eq("user_id", currentUser.id)
          .limit(5); // Example: limit to 5 favorite spots

        if (savedError) throw savedError;

        // Transform data to match expected structure if needed
        const favorites = saved
          ? saved
              .map((s) => {
                if (s.spots && typeof s.spots === "object") {
                  return {
                    ...s.spots, // Spread the spot details
                    id: s.spot_id, // Ensure the id is the spot_id from saved_spots context
                    average_rating:
                      s.spots.average_rating ||
                      4.0 + parseFloat((Math.random() * 0.9).toFixed(1)), // Ensure this is a number
                  };
                } else {
                  console.warn(
                    `Saved spot with spot_id ${s.spot_id} is missing spot details or spot details are not an object. Skipping.`
                  );
                  return null;
                }
              })
              .filter((spot) => spot !== null) // Filter out any null entries
          : [];
        setFavoriteSpots(favorites);
      } catch (e) {
        console.error("Full error object fetching favorite spots:", e); // Log the full error object

        let errorTitle = "Could not load favorite spots.";
        let detailMessage = "";

        if (e && typeof e === "object") {
          detailMessage = e.message
            ? `Message: ${e.message}`
            : "No specific message.";
          if (e.code) detailMessage += ` (Code: ${e.code})`;
          if (e.details) console.error("Error details:", e.details);
          if (e.hint) console.error("Error hint:", e.hint);

          // For toast, keep it concise but include code if available
          toast.error(
            `${errorTitle} ${e.message ? e.message : ""}${
              e.code ? ` (Code: ${e.code})` : ""
            }`
          );
        } else if (typeof e === "string") {
          detailMessage = `Error: ${e}`;
          toast.error(`${errorTitle} ${e}`);
        } else {
          toast.error(errorTitle);
        }

        console.error(`Error fetching favorite spots - ${detailMessage}`);
        setError(
          (prev) =>
            (prev ? prev + "\\n" : "") +
            `${errorTitle} Check console for more details.`
        );
        setFavoriteSpots([]); // Set to empty array on error
      }

      setLoading(false);
    };

    fetchProfilePageData();
  }, [navigate]);

  const handleLogout = async () => {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      toast.error("Failed to log out: " + signOutError.message);
    } else {
      toast.success("Logged out successfully!");
      setProfileData(null);
      setUser(null);
      setRideHistory([]);
      setFavoriteSpots([]);
      navigate("/login");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900">
        <LoadingSpinner text="Loading Profile..." />
      </div>
    );
  }

  if (error && !profileData) {
    return (
      <div className="min-h-screen bg-gray-900 text-neutral-300 flex flex-col items-center justify-center p-4">
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl text-center">
          <h2 className="text-2xl font-semibold text-red-400 mb-4">
            Profile Error
          </h2>
          <p className="mb-2">
            There was an issue loading your profile: {error}
          </p>
          <p className="mb-6">
            Please try logging out and logging back in, or refresh the page.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg shadow-md"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!profileData && !user) {
    // This case should ideally be handled by the redirect in useEffect
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-neutral-300">
        <p className="mr-2">No user data. Redirecting to login...</p>
        <LoadingSpinner />
      </div>
    );
  }

  // Fallback if profileData is somehow null but user exists (e.g. profile creation failed)
  const displayName =
    profileData?.full_name || user?.email?.split("@")[0] || "Skater";
  const displayLocation = profileData?.location || "Unknown Location";
  const displayAvatarUrl = profileData?.avatar_url;
  // Use total_rides and total_distance_km from profileData if they were set (even if placeholders)
  const displayTotalRides = profileData?.total_rides ?? 0;
  const displayTotalDistance = profileData?.total_distance_km ?? 0;

  return (
    <div className="min-h-screen bg-gray-900 text-neutral-200 font-sans pb-24">
      {" "}
      {/* Added pb-24 for bottom nav */}
      {/* Top Bar */}
      <div className="bg-gray-800 shadow-md sticky top-0 z-40">
        {" "}
        {/* z-40 to be below potential modals */}
        <div className="container mx-auto px-4 h-14 flex items-center justify-center relative">
          <h1 className="text-lg font-semibold text-white">Profile</h1>
          {/* Add any top bar actions here if needed, e.g., edit button for mobile */}
        </div>
      </div>
      <div className="container mx-auto p-4 max-w-2xl">
        {" "}
        {/* max-w-2xl for better readability on larger screens */}
        {/* User Info Section */}
        <section className="text-center py-6">
          <div className="mb-4">
            {displayAvatarUrl ? (
              <img
                src={displayAvatarUrl}
                alt="User Avatar"
                className="w-24 h-24 rounded-full mx-auto border-2 border-primary-500 object-cover shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full mx-auto bg-gray-700 flex items-center justify-center border-2 border-primary-500 shadow-lg">
                <FiUser className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>
          <h2 className="text-2xl font-bold text-white">{displayName}</h2>
          {displayLocation && (
            <p className="text-sm text-neutral-400 flex items-center justify-center mt-1">
              <FiMapPin className="mr-1.5" /> {displayLocation}
            </p>
          )}
          <div className="flex justify-center space-x-6 mt-3 text-sm text-neutral-300">
            <span className="flex items-center">
              <FiTrendingUp className="mr-1.5 text-primary-400" />
              {displayTotalRides} Rides
            </span>
            <span className="flex items-center">
              <FiChevronsRight className="mr-1.5 text-primary-400" />{" "}
              {/* Changed icon for variety */}
              {displayTotalDistance} km
            </span>
          </div>
        </section>
        {/* Ride History Section */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-neutral-100 mb-3 px-1 flex justify-between items-center">
            <span>Ride History</span>
            {rideHistory.length > 0 && (
              <Link
                to="/rides"
                className="text-sm text-primary-400 hover:text-primary-300 flex items-center"
              >
                View All <FiChevronRight className="ml-1" />
              </Link>
            )}
          </h3>
          <div className="space-y-3">
            {rideHistory.length > 0 ? (
              rideHistory.map((ride) => (
                <div
                  key={ride.id}
                  className="bg-gray-800 p-4 rounded-lg shadow-md hover:bg-gray-750 transition-colors duration-150"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-white">
                        {ride.name || "Unnamed Ride"}
                      </h4>
                      <p className="text-xs text-neutral-400">
                        {new Date(ride.ride_date).toLocaleDateString()}{" "}
                        {/* Changed ride.date to ride.ride_date */}
                      </p>
                    </div>
                    <FiChevronRight className="text-neutral-500 mt-1" />
                  </div>
                  <div className="mt-2 text-xs text-neutral-300 flex items-center space-x-3">
                    {ride.distance_km && (
                      <span className="flex items-center">
                        <FiTrendingUp className="mr-1 text-primary-400" />{" "}
                        {ride.distance_km} km
                      </span>
                    )}
                    {ride.duration_min && (
                      <span className="flex items-center">
                        <FiClock className="mr-1 text-primary-400" />{" "}
                        {ride.duration_min} min
                      </span>
                    )}
                  </div>
                  {/* Future: Link to a detailed ride page: <Link to={`/rides/${ride.id}`}>...</Link> */}
                </div>
              ))
            ) : (
              <div className="bg-gray-800 p-4 rounded-lg shadow-md text-center">
                <FiClock className="mx-auto text-4xl text-gray-500 mb-2" />
                <p className="text-neutral-400">No rides logged yet.</p>
                <p className="text-xs text-neutral-500 mt-1">
                  Time to hit the pavement!
                </p>
                {/* Optional: Link to add a new ride */}
                {/* <Link to="/add-ride" className="mt-3 inline-block px-4 py-2 text-sm bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg">
                  Log First Ride
                </Link> */}
              </div>
            )}
          </div>
        </section>
        {/* Favorite Spots Section */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-neutral-100 mb-3 px-1 flex justify-between items-center">
            <span>Favorite Spots</span>
            {favoriteSpots.length > 0 && (
              <Link
                to="/spots/favorites"
                className="text-sm text-primary-400 hover:text-primary-300 flex items-center"
              >
                View All <FiChevronRight className="ml-1" />
              </Link>
            )}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {favoriteSpots.length > 0 ? (
              favoriteSpots.map((spot) => (
                <Link // Make the whole card a link to the spot detail
                  to={`/spots/${spot.id}`}
                  key={spot.id}
                  className="bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-150 group"
                >
                  {spot.image_url ? ( // This will now likely be false until image_url is re-added and populated
                    <img
                      src={spot.image_url}
                      alt={spot.name || "Spot image"}
                      className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-700 flex items-center justify-center">
                      <FiImage className="w-12 h-12 text-gray-500" />
                    </div>
                  )}
                  <div className="p-3">
                    <h4
                      className="font-semibold text-white truncate"
                      title={spot.name}
                    >
                      {spot.name || "Unnamed Spot"}
                    </h4>
                    <p
                      className="text-xs text-neutral-400 mb-1 truncate"
                      title={spot.location_address}
                    >
                      {spot.location_address || "No address"}
                    </p>
                    <div className="flex items-center text-xs">
                      <FiStar className="text-yellow-400 mr-1" />
                      <span className="text-neutral-300">
                        {spot.average_rating
                          ? parseFloat(spot.average_rating).toFixed(1)
                          : "N/A"}
                      </span>
                      {/* <span className="text-neutral-500 ml-1">(placeholder rating)</span> */}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="bg-gray-800 p-4 rounded-lg shadow-md text-center sm:col-span-2">
                <FiHeart className="mx-auto text-4xl text-gray-500 mb-2" />
                <p className="text-neutral-400">No favorite spots saved yet.</p>
                <p className="text-xs text-neutral-500 mt-1">
                  Explore and save some cool spots!
                </p>
                <Link
                  to="/spots"
                  className="mt-3 inline-block px-4 py-2 text-sm bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg"
                >
                  Find Spots
                </Link>
              </div>
            )}
          </div>
        </section>
        {/* Settings & Actions Section */}
        <section>
          <h3 className="text-lg font-semibold text-neutral-100 mb-3 px-1">
            Settings
          </h3>
          <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <Link
              to="/profile/edit" // Placeholder for edit profile route
              className="flex items-center justify-between p-3.5 hover:bg-gray-750 transition-colors duration-150 border-b border-gray-700"
            >
              <div className="flex items-center space-x-3.5">
                <FiEdit className="w-5 h-5 text-primary-400" />
                <span className="text-white">Edit Profile</span>
              </div>
              <FiChevronRight className="w-5 h-5 text-neutral-500" />
            </Link>
            <button
              onClick={() => toast.info("App Settings: Coming soon!")} // Placeholder action
              className="w-full flex items-center justify-between p-3.5 hover:bg-gray-750 transition-colors duration-150 border-b border-gray-700"
            >
              <div className="flex items-center space-x-3.5">
                <FiSettings className="w-5 h-5 text-primary-400" />
                <span className="text-white">App Settings</span>
              </div>
              <FiChevronRight className="w-5 h-5 text-neutral-500" />
            </button>
            <button
              onClick={() => toast.info("Support: Coming soon!")} // Placeholder action
              className="w-full flex items-center justify-between p-3.5 hover:bg-gray-750 transition-colors duration-150 border-b border-gray-700"
            >
              <div className="flex items-center space-x-3.5">
                <FiHeart className="w-5 h-5 text-primary-400" />
                <span className="text-white">Support</span>
              </div>
              <FiChevronRight className="w-5 h-5 text-neutral-500" />
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-3.5 hover:bg-gray-750 transition-colors duration-150"
            >
              <div className="flex items-center space-x-3.5">
                <FiLogOut className="w-5 h-5 text-red-400" />
                <span className="text-red-400 font-medium">Log Out</span>
              </div>
              <FiChevronRight className="w-5 h-5 text-neutral-500" />
            </button>
          </div>
        </section>
      </div>
      {/* Bottom Navigation will be a separate component added in App.jsx */}
    </div>
  );
};

export default Profile;
