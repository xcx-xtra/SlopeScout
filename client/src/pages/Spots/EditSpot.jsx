import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import supabase from "../../supabaseClient";
import Map from "../../components/Map";
import { toast } from "react-toastify";
import LoadingSpinner from "../../components/LoadingSpinner";

const EditSpot = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    description: "",
    difficulty: "",
    elevation_gain: "",
    // location is handled by marker state, will be an object {lng, lat}
  });
  const [marker, setMarker] = useState(null); // Holds {lng, lat} from map clicks or fetched data
  const [initialLocation, setInitialLocation] = useState(null); // To compare if location changed
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({}); // For field-specific errors

  useEffect(() => {
    const fetchSpot = async () => {
      setLoading(true);
      setErrors({});
      toast.dismiss();

      try {
        const res = await fetch(`http://localhost:3001/api/spots/${id}`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(
            errorData.error || `Error fetching spot: ${res.statusText}`
          );
        }
        const data = await res.json();
        if (data) {
          setForm({
            name: data.name || "",
            description: data.description || "",
            difficulty: data.difficulty || "",
            elevation_gain:
              data.elevation_gain === null ? "" : String(data.elevation_gain), // Ensure string for input, handle null
            // location will be set via marker
          });
          // Assuming data.location is stored as {lng, lat} or a stringified version of it
          let parsedLocation = null;
          if (data.location) {
            if (typeof data.location === "string") {
              try {
                parsedLocation = JSON.parse(data.location);
              } catch (e) {
                console.error("Failed to parse location string:", e);
                toast.error("Failed to parse location data from server.");
              }
            } else if (typeof data.location === "object") {
              parsedLocation = data.location; // Already an object
            }
          }
          if (
            parsedLocation &&
            parsedLocation.lng !== undefined &&
            parsedLocation.lat !== undefined
          ) {
            setMarker(parsedLocation);
            setInitialLocation(parsedLocation); // Store initial location for comparison
          } else {
            // Handle cases where location might be null or malformed
            setMarker(null);
            setInitialLocation(null);
          }
        } else {
          throw new Error("Spot data not found.");
        }
      } catch (err) {
        console.error("Fetch spot error:", err);
        setErrors({ general: err.message || "Failed to fetch spot details." });
        toast.error(err.message || "Failed to fetch spot details.");
        // Optionally navigate back or to an error page if spot doesn't load
        // navigate("/spots");
      }
      setLoading(false);
    };
    fetchSpot();
  }, [id, navigate]);

  const handleMapClick = (lngLat) => {
    setMarker(lngLat); // lngLat is {lng, lat}
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({ ...prevForm, [name]: value }));
    if (errors[name]) {
      setErrors((prevErrors) => ({ ...prevErrors, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Name is required.";
    if (!form.difficulty) newErrors.difficulty = "Difficulty is required.";
    // Elevation gain can be 0, so !form.elevation_gain might be too strict if 0 is valid.
    // If it must be positive or has other rules, add them here.
    // if (form.elevation_gain.trim() && isNaN(Number(form.elevation_gain))) {
    //   newErrors.elevation_gain = "Elevation gain must be a number.";
    // }
    if (!marker) newErrors.location = "Please select a location on the map.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    toast.dismiss();

    if (!validateForm()) {
      toast.error("Please correct the errors in the form.");
      return;
    }

    setSubmitting(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      setErrors({ general: "You must be logged in to update a spot." });
      toast.error("Authentication required. Please log in again.");
      setSubmitting(false);
      return;
    }

    const spotUpdateData = {
      name: form.name.trim(),
      description: form.description.trim(),
      difficulty: form.difficulty,
      // Ensure elevation_gain is a number or null if empty
      elevation_gain:
        form.elevation_gain.trim() === "" ? null : Number(form.elevation_gain),
      // Location is taken from the marker state
      location: marker ? { lng: marker.lng, lat: marker.lat } : null,
    };

    // Check if elevation_gain is valid if provided
    if (
      spotUpdateData.elevation_gain !== null &&
      isNaN(spotUpdateData.elevation_gain)
    ) {
      setErrors((prev) => ({
        ...prev,
        elevation_gain: "Elevation gain must be a valid number or empty.",
      }));
      toast.error("Invalid elevation gain.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`http://localhost:3001/api/spots/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(spotUpdateData),
      });

      const responseData = await res.json();

      if (res.ok) {
        toast.success(responseData.message || "Spot updated successfully!");
        navigate(`/spots/${id}`); // Navigate to spot detail page
      } else {
        setErrors({ general: responseData.error || "Error updating spot" });
        toast.error(
          responseData.error || "Failed to update spot. Please try again."
        );
      }
    } catch (err) {
      console.error("Submit error:", err);
      setErrors({
        general: "Network error or server issue. Please try again.",
      });
      toast.error("Network error. Could not update spot.");
    }
    setSubmitting(false);
  };

  if (loading)
    return (
      <div className="p-4 flex justify-center items-center min-h-[calc(100vh-200px)]">
        <LoadingSpinner text="Loading spot details..." />
      </div>
    );

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-sans">
      <form
        onSubmit={handleSubmit}
        className="p-6 sm:p-8 bg-white rounded-xl shadow-2xl my-8 lg:max-w-4xl xl:max-w-6xl mx-auto border border-neutral-200"
      >
        <h2 className="text-3xl sm:text-4xl font-bold text-primary-dark mb-8 text-center font-serif">
          Edit Skate Spot
        </h2>

        {errors.general && (
          <div
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6 shadow"
            role="alert"
          >
            <p className="font-bold">Error</p>
            <p>{errors.general}</p>
          </div>
        )}

        <div className="md:flex md:gap-8">
          {/* Column 1: Form Fields */}
          <div className="md:w-1/2 space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                Spot Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Spot Name (e.g., Downtown Ledges)"
                className={`block w-full p-3 border rounded-lg shadow-sm text-sm
                  ${
                    errors.name
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                      : "border-neutral-300 focus:ring-primary focus:border-primary"
                  }`}
              />
              {errors.name && (
                <p className="text-red-600 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Detailed description of the spot (optional)"
                rows="4"
                className="block w-full p-3 border border-neutral-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="difficulty"
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                Difficulty <span className="text-red-500">*</span>
              </label>
              <select
                name="difficulty"
                id="difficulty"
                value={form.difficulty}
                onChange={handleChange}
                className={`block w-full p-3 border rounded-lg shadow-sm bg-white text-sm
                  ${
                    errors.difficulty
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                      : "border-neutral-300 focus:ring-primary focus:border-primary"
                  }`}
              >
                <option value="">Select Difficulty</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
                {/* Standardized from Beginner, Intermediate, Advanced, Pro */}
              </select>
              {errors.difficulty && (
                <p className="text-red-600 text-xs mt-1">{errors.difficulty}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="elevation_gain"
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                Elevation Gain (meters)
              </label>
              <input
                id="elevation_gain"
                name="elevation_gain"
                type="number"
                value={form.elevation_gain}
                onChange={handleChange}
                placeholder="e.g., 5 (optional)"
                className={`block w-full p-3 border rounded-lg shadow-sm text-sm
                  ${
                    errors.elevation_gain
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                      : "border-neutral-300 focus:ring-primary focus:border-primary"
                  }`}
              />
              {errors.elevation_gain && (
                <p className="text-red-600 text-xs mt-1">
                  {errors.elevation_gain}
                </p>
              )}
            </div>
          </div>

          {/* Column 2: Map */}
          <div className="md:w-1/2 mt-8 md:mt-0">
            <div className="mb-3">
              <label className="block mb-2 text-sm font-medium text-neutral-700">
                Location (click on map to adjust){" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="h-72 md:h-full w-full rounded-lg border-2 border-neutral-300 overflow-hidden shadow-md">
                <Map onMapClick={handleMapClick} marker={marker} />
              </div>
              {marker && (
                <div className="text-xs mt-2 text-neutral-600 bg-neutral-100 p-2 rounded-md">
                  Current Location: Lng: {marker.lng.toFixed(5)}, Lat:{" "}
                  {marker.lat.toFixed(5)}
                </div>
              )}
              {errors.location && (
                <p className="text-red-600 text-xs mt-1">{errors.location}</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-neutral-200 flex flex-col sm:flex-row justify-end sm:space-x-3 space-y-3 sm:space-y-0">
          <button
            type="button" // Important: type="button" to prevent form submission
            onClick={() => navigate(spot ? `/spots/${id}` : "/spots")}
            className="w-full sm:w-auto bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-opacity-75 flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z"
                clipRule="evenodd"
              />
            </svg>
            Cancel
          </button>
          <button
            className={`w-full sm:w-auto bg-accent-500 hover:bg-accent-600 text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-opacity-75 flex items-center justify-center ${
              submitting ? "opacity-75 cursor-not-allowed" : ""
            }`}
            type="submit"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <LoadingSpinner size="sm" color="text-white" /> Updating...
              </>
            ) : (
              <>
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
                Update Spot
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditSpot;
