import Map from "../../components/Map";
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import supabase from "../../supabaseClient"; // Import supabase client
import { toast } from "react-toastify"; // Import toast
import LoadingSpinner from "../../components/LoadingSpinner"; // Import LoadingSpinner
import {
  FiArrowLeft,
  FiMapPin,
  FiTrendingUp,
  FiPaperclip,
  FiNavigation,
  FiHeart,
  FiShare2,
  FiEdit,
  FiTrash2,
  FiStar,
  FiImage,
  FiUser,
  FiMessageSquare, // For "Add Review" button
  FiChevronDown, // For "Show More" on description
  FiChevronUp, // For "Show Less" on description
} from "react-icons/fi";

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
  const [reviews, setReviews] = useState([]); // Add state for reviews
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false); // State for review form visibility
  const [newReviewText, setNewReviewText] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Dummy reviews data - replace with actual API call
  const fetchReviews = async (spotId) => {
    if (!spotId) return;
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select(
          `
          id,
          comment,
          rating,
          created_at,
          user_id,
          profiles (
            full_name,
            avatar_url
          )
        `
        )
        .eq("spot_id", spotId)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }
      // Process reviews to include user_name and user_avatar directly
      const processedReviews = data.map((review) => ({
        ...review,
        user_name: review.profiles?.full_name || "Anonymous",
        user_avatar: review.profiles?.avatar_url || null, // Use null for default avatar handling in component
      }));
      setReviews(processedReviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("Could not load reviews: " + error.message);
      setReviews([]); // Set to empty array on error
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!currentUser || !spot) {
      toast.error(
        "You must be logged in and on a spot page to submit a review."
      );
      return;
    }
    if (newReviewRating === 0) {
      toast.error("Please select a rating.");
      return;
    }
    if (!newReviewText.trim()) {
      toast.error("Please enter a comment.");
      return;
    }

    setSubmittingReview(true);
    toast.dismiss();

    try {
      const { data, error } = await supabase
        .from("reviews")
        .insert([
          {
            spot_id: spot.id,
            user_id: currentUser.id,
            rating: newReviewRating,
            comment: newReviewText.trim(),
          },
        ])
        .select(
          `
          id,
          comment,
          rating,
          created_at,
          user_id,
          profiles (
            full_name,
            avatar_url
          )
        `
        ); // Select the newly created review with profile info

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const newReview = {
          ...data[0],
          user_name: data[0].profiles?.full_name || "Anonymous",
          user_avatar: data[0].profiles?.avatar_url || null,
        };
        setReviews([newReview, ...reviews]); // Add new review to the top
        toast.success("Review submitted successfully!");
        setShowReviewForm(false);
        setNewReviewText("");
        setNewReviewRating(0);
      } else {
        toast.error("Failed to submit review. No data returned.");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review: " + error.message);
    }
    setSubmittingReview(false);
  };

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
          fetchReviews(data.id); // Fetch reviews after spot data is loaded
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
        navigate("/"); // Changed from /spots to /
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

    // Ensure spot and spot.id are available
    if (!spot || typeof spot.id === "undefined") {
      toast.error("Spot data is not available. Cannot save/unsave.");
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
      <div className="flex justify-center items-center min-h-screen bg-gray-900">
        <LoadingSpinner text="Loading spot details..." />
      </div>
    );
  if (error && !spot)
    return (
      <div className="min-h-screen bg-gray-900 text-neutral-300 flex flex-col items-center justify-center p-4">
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl text-center">
          <h2 className="text-2xl font-semibold text-red-400 mb-4">
            Spot Error
          </h2>
          <p className="mb-2">There was an issue loading this spot: {error}</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg shadow-md"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  if (!spot)
    return (
      <div className="min-h-screen bg-gray-900 text-neutral-300 flex flex-col items-center justify-center p-4">
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl text-center">
          <h2 className="text-2xl font-semibold text-neutral-100">
            Spot Not Found
          </h2>
          <p className="text-neutral-400 mt-2 mb-6">
            The spot you are looking for does not exist or may have been
            removed.
          </p>
          <Link
            to="/"
            className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg shadow-md"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );

  // Attempt to parse location if it's a string
  let parsedLocation = null;
  if (spot.location) {
    if (typeof spot.location === "string") {
      try {
        parsedLocation = JSON.parse(spot.location);
      } catch (e) {
        console.error("Failed to parse spot location string:", e);
        // Keep parsedLocation as null if parsing fails
      }
    } else if (typeof spot.location === "object") {
      parsedLocation = spot.location; // Assume it's already a valid object
    }
  }

  const spotImage = spot.image_url || null; // Use image_url from spot data

  // Star rating component for review form
  const StarRatingInput = ({ rating, setRating }) => {
    return (
      <div className="flex space-x-1 mb-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            className={`w-6 h-6 cursor-pointer ${
              star <= rating ? "text-yellow-400 fill-current" : "text-gray-600"
            }`}
            onClick={() => setRating(star)}
          />
        ))}
      </div>
    );
  };

  // Spot Details items from wireframe
  const spotDetailsItems = [
    {
      icon: FiTrendingUp,
      label: "Slope Gradient",
      value: spot.slope_gradient || "N/A",
    },
    {
      icon: FiArrowLeft,
      label: "Elevation Change",
      value: spot.elevation_change ? `${spot.elevation_change}m` : "N/A", // Using FiArrowLeft as a placeholder for elevation icon
    },
    {
      icon: FiPaperclip,
      label: "Surface Quality",
      value: spot.surface_quality || "N/A",
    },
  ];

  const descriptionToShow = showFullDescription
    ? spot.description
    : spot.description && spot.description.length <= 150
    ? spot.description
    : spot.description && `${spot.description.substring(0, 150)}...`;

  return (
    <div className="min-h-screen bg-gray-900 text-neutral-200 font-sans">
      {/* Top Bar */}
      <div className="bg-gray-800 shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-white hover:text-primary-400"
          >
            <FiArrowLeft size={22} />
          </button>
          <h1 className="text-lg font-semibold text-white truncate px-2">
            {spot.name || "Spot Details"}
          </h1>
          <div className="w-10">
            {" "}
            {/* Placeholder for potential right-side icon */}
          </div>
        </div>
      </div>

      {/* Image Carousel/Placeholder */}
      <div className="w-full h-60 sm:h-72 md:h-80 bg-gray-700 flex items-center justify-center overflow-hidden">
        {spotImage ? (
          <img
            src={spotImage}
            alt={spot.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <FiImage size={60} className="text-gray-500" />
        )}
        {/* Future: Implement a carousel if multiple images */}
      </div>

      <div className="container mx-auto p-4 max-w-2xl pb-24">
        {/* Spot Name (already in top bar, but could be repeated here if design changes) */}
        {/* <h2 className="text-2xl font-bold text-white mb-4 mt-2">{spot.name}</h2> */}

        {/* Spot Details Section */}
        <section className="mb-6">
          <h3 className="text-xl font-semibold text-neutral-100 mb-3">
            Spot Details
          </h3>
          <div className="space-y-3">
            {spotDetailsItems.map((item, index) => (
              <div
                key={index}
                className="bg-gray-800 p-3.5 rounded-lg shadow flex items-center"
              >
                <item.icon className="w-6 h-6 text-primary-400 mr-4 flex-shrink-0" />
                <div>
                  <p className="text-sm text-neutral-400">{item.label}</p>
                  <p className="text-base text-white font-medium">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Description (if available) */}
        {spot.description && (
          <section className="mb-6">
            <h3 className="text-xl font-semibold text-neutral-100 mb-2">
              Description
            </h3>
            <div className="bg-gray-800 p-3.5 rounded-lg shadow">
              <p className="text-neutral-300 whitespace-pre-wrap break-words">
                {descriptionToShow}
              </p>
              {spot.description.length > 150 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-primary-400 hover:text-primary-300 mt-2 text-sm flex items-center"
                >
                  {showFullDescription ? "Show Less" : "Show More"}
                  {showFullDescription ? (
                    <FiChevronUp className="ml-1" />
                  ) : (
                    <FiChevronDown className="ml-1" />
                  )}
                </button>
              )}
            </div>
          </section>
        )}

        {/* Map Section (Optional, if coordinates exist) */}
        {parsedLocation && parsedLocation.lat && parsedLocation.lng && (
          <section className="mb-6">
            <h3 className="text-xl font-semibold text-neutral-100 mb-3">
              Location Map
            </h3>
            <div className="h-64 rounded-lg overflow-hidden shadow-lg">
              <Map
                spots={[{ ...spot, location: parsedLocation }]}
                interactive={false}
                mapStyle="mapbox://styles/mapbox/dark-v11"
              />
            </div>
            <p className="text-xs text-neutral-400 mt-2 text-center">
              Lat: {parsedLocation.lat.toFixed(5)}, Lng:{" "}
              {parsedLocation.lng.toFixed(5)}
            </p>
          </section>
        )}

        {/* Actions Section */}
        <section className="mb-6">
          <h3 className="text-xl font-semibold text-neutral-100 mb-3">
            Actions
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <button
              className="flex flex-col items-center justify-center bg-gray-800 p-3 rounded-lg shadow hover:bg-gray-750 transition-colors"
              onClick={() => toast.info("Navigate: Coming soon!")}
            >
              <FiNavigation size={22} className="text-primary-400 mb-1" />
              <span className="text-xs text-neutral-300">Navigate</span>
            </button>
            <button
              className={`flex flex-col items-center justify-center bg-gray-800 p-3 rounded-lg shadow hover:bg-gray-750 transition-colors ${
                saving ? "opacity-50" : ""
              }`}
              onClick={handleToggleSaveSpot}
              disabled={saving || !currentUser}
            >
              <FiHeart
                size={22}
                className={`${
                  isSaved ? "text-red-500 fill-current" : "text-primary-400"
                } mb-1`}
              />
              <span className="text-xs text-neutral-300">
                {saving
                  ? isSaved
                    ? "Unsaving..."
                    : "Saving..."
                  : isSaved
                  ? "Favorited"
                  : "Favorite"}
              </span>
            </button>
            <button
              className="flex flex-col items-center justify-center bg-gray-800 p-3 rounded-lg shadow hover:bg-gray-750 transition-colors"
              onClick={() => toast.info("Share: Coming soon!")}
            >
              <FiShare2 size={22} className="text-primary-400 mb-1" />
              <span className="text-xs text-neutral-300">Share</span>
            </button>
          </div>
          {/* Admin Actions: Edit & Delete */}
          {currentUser && spot && spot.user_id === currentUser.id && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow transition-colors"
                onClick={() => navigate(`/spots/${id}/edit`)}
              >
                <FiEdit size={18} className="mr-2" /> Edit
              </button>
              <button
                className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow transition-colors"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <FiTrash2 size={18} className="mr-2" />
                )}
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          )}
        </section>

        {/* Reviews Section */}
        <section className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xl font-semibold text-neutral-100">
              Reviews ({reviews.length})
            </h3>
            <button
              className="bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium py-1.5 px-3 rounded-md flex items-center transition-colors"
              onClick={() => setShowReviewForm(true)} // Open review form
              disabled={!currentUser} // Disable if not logged in
            >
              <FiMessageSquare size={16} className="mr-1.5" /> Add Review
            </button>
          </div>

          {/* Review Form Modal/Section */}
          {showReviewForm && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                <h4 className="text-lg font-semibold text-white mb-4">
                  Submit Your Review
                </h4>
                <form onSubmit={handleSubmitReview}>
                  <div className="mb-3">
                    <label
                      htmlFor="rating"
                      className="block text-sm font-medium text-neutral-300 mb-1"
                    >
                      Your Rating
                    </label>
                    <StarRatingInput
                      rating={newReviewRating}
                      setRating={setNewReviewRating}
                    />
                  </div>
                  <div className="mb-4">
                    <label
                      htmlFor="comment"
                      className="block text-sm font-medium text-neutral-300 mb-1"
                    >
                      Your Comment
                    </label>
                    <textarea
                      id="comment"
                      name="comment"
                      rows="4"
                      className="w-full p-2 bg-gray-700 text-neutral-200 rounded-md border border-gray-600 focus:ring-primary-500 focus:border-primary-500"
                      value={newReviewText}
                      onChange={(e) => setNewReviewText(e.target.value)}
                      placeholder="Share your experience with this spot..."
                      required
                    ></textarea>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowReviewForm(false);
                        setNewReviewRating(0);
                        setNewReviewText("");
                      }}
                      className="px-4 py-2 text-sm font-medium text-neutral-300 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
                      disabled={submittingReview}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-md transition-colors flex items-center"
                      disabled={submittingReview}
                    >
                      {submittingReview ? (
                        <LoadingSpinner size="sm" text="Submitting..." />
                      ) : (
                        "Submit Review"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-gray-800 p-3.5 rounded-lg shadow"
                >
                  <div className="flex items-center mb-2">
                    {review.user_avatar ? (
                      <img
                        src={review.user_avatar}
                        alt={review.user_name}
                        className="w-8 h-8 rounded-full mr-2.5 object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-2.5">
                        <FiUser className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {review.user_name}
                      </p>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <FiStar
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < review.rating
                                ? "text-yellow-400 fill-current"
                                : "text-gray-600"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-300 leading-relaxed">
                    {review.comment}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1.5 text-right">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <div className="bg-gray-800 p-6 rounded-lg shadow text-center">
                <FiMessageSquare className="mx-auto text-3xl text-gray-500 mb-2" />
                <p className="text-neutral-400">
                  No reviews yet for this spot.
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  Be the first to share your thoughts!
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default SpotDetail;
