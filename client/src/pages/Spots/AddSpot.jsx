import { useState, useEffect, useCallback } from "react";
import supabase from "../../supabaseClient";
import Map from "../../components/Map";
import { toast } from "react-toastify";
import { FiLoader } from "react-icons/fi";

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
    <div className="retro-add-spot">
      <div className="retro-add-spot-container">
        <h2 className="retro-add-spot-title">Add New Spot</h2>
        <form onSubmit={handleSubmit} className="retro-add-spot-form">
          <div className="retro-form-group">
            <label htmlFor="name" className="retro-form-label">
              Spot Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g., Main Street Hill"
              className={`retro-form-input ${
                errors.name ? "retro-form-input-error" : ""
              }`}
            />
            {errors.name && <p className="retro-form-error">{errors.name}</p>}
          </div>
          <div className="retro-form-group">
            <label htmlFor="location_address" className="retro-form-label">
              Location (Auto-filled from map click or current location)
            </label>
            <input
              type="text"
              name="location_address"
              id="location_address"
              value={form.location_address}
              readOnly
              className="retro-form-input retro-form-input-readonly"
              placeholder="Click on the map or allow geolocation"
            />
            <div className="retro-map-container">
              <Map
                onMapClick={handleMapClick}
                marker={marker}
                interactive={true}
              />
            </div>
            {locationLoading && (
              <div className="retro-loading-inline">
                <FiLoader className="retro-loading-icon" />
                <span>Fetching address...</span>
              </div>
            )}
            {errors.location && (
              <p className="retro-form-error">{errors.location}</p>
            )}
          </div>
          {/* Grouping Slope Gradient and Elevation Change */}
          <div className="retro-form-grid">
            {" "}
            {/* Added gap-y-6 for consistency */}
            <div className="retro-form-group">
              <label htmlFor="slope_gradient" className="retro-form-label">
                Slope Gradient (%)
              </label>
              <input
                type="number"
                name="slope_gradient"
                id="slope_gradient"
                value={form.slope_gradient}
                onChange={handleChange}
                placeholder="e.g., 15"
                className={`retro-form-input ${
                  errors.slope_gradient ? "retro-form-input-error" : ""
                }`}
              />
              {errors.slope_gradient && (
                <p className="retro-form-error">{errors.slope_gradient}</p>
              )}
            </div>
            <div className="retro-form-group">
              <label htmlFor="elevation_change" className="retro-form-label">
                Elevation Change (meters)
              </label>
              <input
                type="number"
                name="elevation_change"
                id="elevation_change"
                value={form.elevation_change}
                onChange={handleChange}
                placeholder="e.g., 10"
                className={`retro-form-input ${
                  errors.elevation_change ? "retro-form-input-error" : ""
                }`}
              />
              {errors.elevation_change && (
                <p className="retro-form-error">{errors.elevation_change}</p>
              )}
            </div>
          </div>
          <div className="retro-form-group">
            <label htmlFor="surface_quality" className="retro-form-label">
              Surface Quality
            </label>
            <select
              name="surface_quality"
              id="surface_quality"
              value={form.surface_quality}
              onChange={handleChange}
              className={`retro-form-select ${
                errors.surface_quality ? "retro-form-input-error" : ""
              }`}
            >
              <option value="" disabled>
                Select surface type
              </option>
              {surfaceTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.surface_quality && (
              <p className="retro-form-error">{errors.surface_quality}</p>
            )}
          </div>
          <div className="retro-form-group">
            <label htmlFor="description" className="retro-form-label">
              Description (Optional)
            </label>
            <textarea
              name="description"
              id="description"
              value={form.description}
              onChange={handleChange}
              rows="4"
              placeholder="e.g., Long smooth hill with a good runout area. Watch out for a crack mid-way."
              className={`retro-form-textarea ${
                errors.description ? "retro-form-input-error" : ""
              }`}
            ></textarea>
            {errors.description && (
              <p className="retro-form-error">{errors.description}</p>
            )}
          </div>
          {errors.general && (
            <p className="retro-form-error retro-form-error-center">
              {errors.general}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="retro-btn retro-btn-primary retro-btn-submit"
          >
            {isSubmitting ? (
              <div className="retro-loading-spinner retro-loading-inline"></div>
            ) : (
              <span className="retro-icon">🚀</span>
            )}
            {isSubmitting ? "Submitting..." : "Add Spot"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddSpot;
