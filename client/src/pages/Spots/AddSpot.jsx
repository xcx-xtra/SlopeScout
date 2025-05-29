import { useState, useEffect, useCallback } from "react"; // Added useEffect, useCallback
import supabase from "../../supabaseClient";
import Map from "../../components/Map"; // Assuming you might want to keep the map for location picking
import { toast } from "react-toastify";
import { FiUploadCloud, FiLoader, FiCamera } from "react-icons/fi"; // Added FiCamera, FiUploadCloud might be removed if not used elsewhere after this change

const AddSpot = ({ onAdd }) => {
  const [form, setForm] = useState({
    name: "",
    description: "",
    slope_gradient: "", // Added from wireframe
    elevation_change: "", // Corresponds to elevation_gain
    surface_quality: "", // Added from wireframe
    location_address: "Fetching location...", // For displaying auto-filled address
  });
  const [errors, setErrors] = useState({});
  const [marker, setMarker] = useState(null); // If using map click
  const [currentUser, setCurrentUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false); // Define locationLoading state

  // Fetch current user on component mount
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  // Attempt to get current geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setMarker({ lat: latitude, lng: longitude });
          // Use the backend proxy for initial geolocation as well
          const url = `/api/geocode/reverse?lat=${latitude}&lon=${longitude}`;
          try {
            const response = await fetch(url, {
              headers: {
                "Content-Type": "application/json",
              },
            });
            if (!response.ok) {
              const errorData = await response.json();
              console.error(
                "Error data from backend (initial geoloc):",
                errorData
              );
              throw new Error(
                `HTTP error! status: ${response.status} - ${
                  errorData.error || "Failed to fetch initial address"
                }`
              );
            }
            const data = await response.json();
            setForm((prevForm) => ({
              ...prevForm,
              location_address:
                data.display_name ||
                "Current Location: Unable to fetch address",
            }));
          } catch (error) {
            console.error("Error fetching address: ", error);
            setForm((prevForm) => ({
              ...prevForm,
              location_address: "Current Location: Could not fetch address",
            }));
          }
        },
        (error) => {
          console.error("Error getting location: ", error);
          setForm((prevForm) => ({
            ...prevForm,
            location_address: "Location access denied or unavailable.",
          }));
          toast.warn(
            "Could not auto-fill location. Please select on map or enter manually if available."
          );
        }
      );
    } else {
      setForm((prevForm) => ({
        ...prevForm,
        location_address: "Geolocation is not supported by this browser.",
      }));
    }
  }, []);

  const handleMapClick = async (lngLat) => {
    setMarker(lngLat); // Correctly update the marker state
    setLocationLoading(true);
    // Update the URL to call your backend proxy
    const url = `/api/geocode/reverse?lat=${lngLat.lat}&lon=${lngLat.lng}`;
    try {
      // const response = await fetch(url);
      // if (!response.ok) {
      //   throw new Error(`HTTP error! status: ${response.status}`);
      // }
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const errorData = await response.json(); // Try to get error details from backend
        console.error("Error data from backend:", errorData);
        throw new Error(
          `HTTP error! status: ${response.status} - ${
            errorData.error || "Failed to fetch address"
          }`
        );
      }
      const data = await response.json();
      setForm((prevForm) => ({
        ...prevForm,
        location_address: data.display_name || "Selected on map",
      }));
    } catch (error) {
      console.error("Error fetching address from map click: ", error);
      setForm((prevForm) => ({
        ...prevForm,
        location_address: `Lat: ${lngLat.lat.toFixed(
          5
        )}, Lng: ${lngLat.lng.toFixed(5)} (Address lookup failed)`,
      }));
    } finally {
      setLocationLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    toast.dismiss();
    setIsSubmitting(true);

    if (!currentUser) {
      toast.error("You must be logged in to add a spot.");
      setIsSubmitting(false);
      return;
    }

    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Spot Name is required.";
    if (!marker)
      newErrors.location =
        "Location is required. Please click on the map or allow geolocation.";
    if (!form.surface_quality)
      newErrors.surface_quality = "Surface Quality is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill in all required fields.");
      setIsSubmitting(false);
      return;
    }

    const spotData = {
      user_id: currentUser.id,
      name: form.name.trim(),
      description: form.description.trim(),
      difficulty: "Medium", // Defaulting or remove if not used for AddSpot
      elevation_gain: form.elevation_change
        ? Number(form.elevation_change)
        : null,
      slope_gradient: form.slope_gradient ? Number(form.slope_gradient) : null,
      surface_quality: form.surface_quality,
      location: marker ? { lng: marker.lng, lat: marker.lat } : null, // GeoJSON point for Supabase
      address_text: form.location_address, // Store the fetched address string
    };

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;

    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
      const res = await fetch("http://localhost:3001/api/spots", {
        method: "POST",
        headers,
        body: JSON.stringify(spotData),
      });
      const responseData = await res.json(); // Renamed to avoid conflict with Supabase 'data'
      if (res.ok) {
        toast.success("Spot submitted successfully!");
        setForm({
          name: "",
          description: "",
          slope_gradient: "",
          elevation_change: "",
          surface_quality: "",
          location_address: "Fetching location...",
        });
        setMarker(null);
        if (onAdd) onAdd(responseData);
      } else {
        setErrors({ general: responseData.error || "Error submitting spot" });
        toast.error(responseData.error || "Error submitting spot");
      }
    } catch (err) {
      setErrors({ general: "Network error. Please try again." });
      toast.error("Network error while submitting spot.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const surfaceTypes = [
    "Smooth Concrete",
    "Rough Concrete",
    "Asphalt",
    "Brick/Pavers",
    "Wood",
    "Metal",
    "Other",
  ];

  return (
    <div className="min-h-screen bg-white py-8 px-4 font-sans">
      <div className="max-w-lg mx-auto">
        <h2 className="text-xl font-semibold text-neutral-800 text-center mb-6">
          Add New Spot
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Spot Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g., Main Street Hill"
              className={`w-full p-2.5 border rounded-md shadow-sm text-sm ${
                errors.name ? "border-red-500" : "border-neutral-300"
              }`}
            />
            {errors.name && (
              <p className="text-red-600 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="location_address"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Location (Auto-filled)
            </label>
            <input
              type="text"
              name="location_address"
              id="location_address"
              value={form.location_address}
              readOnly
              className="w-full p-2.5 border border-neutral-300 rounded-md shadow-sm text-sm bg-neutral-50 text-neutral-600"
              placeholder="Current Location: 123 Skate Ave, City, State"
            />
            {/* Optional: Display map for refinement if needed, or just rely on auto-fill and manual entry for coords if no map */}
            <div className="mt-2 h-48 w-full rounded-lg border border-neutral-300 overflow-hidden shadow-sm">
              <Map
                onMapClick={handleMapClick}
                marker={marker}
                interactive={true}
              />
            </div>
            {errors.location && (
              <p className="text-red-600 text-xs mt-1">{errors.location}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="slope_gradient"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Slope Gradient (%)
            </label>
            <input
              type="number"
              name="slope_gradient"
              id="slope_gradient"
              value={form.slope_gradient}
              onChange={handleChange}
              placeholder="e.g., 10"
              className={`w-full p-2.5 border rounded-md shadow-sm text-sm ${
                errors.slope_gradient ? "border-red-500" : "border-neutral-300"
              }`}
            />
            {errors.slope_gradient && (
              <p className="text-red-600 text-xs mt-1">
                {errors.slope_gradient}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="elevation_change"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Elevation Change (meters)
            </label>
            <input
              type="number"
              name="elevation_change"
              id="elevation_change"
              value={form.elevation_change}
              onChange={handleChange}
              placeholder="e.g., 50"
              className={`w-full p-2.5 border rounded-md shadow-sm text-sm ${
                errors.elevation_change
                  ? "border-red-500"
                  : "border-neutral-300"
              }`}
            />
            {errors.elevation_change && (
              <p className="text-red-600 text-xs mt-1">
                {errors.elevation_change}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="surface_quality"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Surface Quality
            </label>
            <select
              name="surface_quality"
              id="surface_quality"
              value={form.surface_quality}
              onChange={handleChange}
              className={`w-full p-2.5 border rounded-md shadow-sm text-sm bg-white ${
                errors.surface_quality ? "border-red-500" : "border-neutral-300"
              }`}
            >
              <option value="">Select surface type</option>
              {surfaceTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.surface_quality && (
              <p className="text-red-600 text-xs mt-1">
                {errors.surface_quality}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Photos (Optional)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-neutral-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <FiCamera className="mx-auto h-10 w-10 text-neutral-400" />
                <div className="flex text-sm text-neutral-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      multiple
                      accept="image/*"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-neutral-500">
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
            </div>
            {/* Actual file handling logic would go here */}
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Description
            </label>
            <textarea
              name="description"
              id="description"
              rows="4"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the spot, key features, challenges, etc."
              className={`w-full p-2.5 border rounded-md shadow-sm text-sm ${
                errors.description ? "border-red-500" : "border-neutral-300"
              }`}
            />
            {errors.description && (
              <p className="text-red-600 text-xs mt-1">{errors.description}</p>
            )}
          </div>

          {errors.general && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded-md text-sm">
              <p>{errors.general}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-neutral-700 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 disabled:bg-neutral-400"
            >
              {isSubmitting ? (
                <FiLoader className="animate-spin -ml-1 mr-2 h-5 w-5" />
              ) : null}
              Submit Spot
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSpot;
