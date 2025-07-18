import { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken =
  "pk.eyJ1IjoieGN4LXh0cmEiLCJhIjoiY21heGh2MG56MGFkdjJzb3A5cWlmbmtiaCJ9.LoM-z-6BvavCtV3PP7KkvA"; // Replace with your real token

const Map = ({ onMapClick, marker, spots }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const newSpotMarkerRef = useRef(null);
  const existingSpotMarkersRef = useRef([]);

  useEffect(() => {
    if (map.current) return;

    console.log("Initializing Mapbox map...");
    console.log("Access token available:", !!mapboxgl.accessToken);
    console.log("Container ref:", mapContainer.current);

    // Default to San Francisco (popular skateboarding location)
    const defaultCenter = [-122.4194, 37.7749];

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12", // Simplified to basic streets style
        center: defaultCenter, // Default center
        zoom: 11, // Default zoom
        antialias: true, // Improves rendering quality
      });

      console.log("Map instance created successfully");

      map.current.on("load", () => {
        console.log("Map loaded successfully");
        // Simplified - removing 3D terrain for now to isolate issues
      });

      map.current.on("error", (e) => {
        console.error("Mapbox error:", e);
      });
    } catch (error) {
      console.error("Error creating map:", error);
    }

    // Attempt to set map center to user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (map.current) {
            const { latitude, longitude } = position.coords;
            map.current.setCenter([longitude, latitude]);
            map.current.setZoom(13); // Optionally set a closer zoom level
            console.log("Successfully set map to user location");
          }
        },
        (error) => {
          // More detailed error handling
          let errorMessage = "Unknown error";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "User denied the request for geolocation";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out";
              break;
          }
          console.info(
            "Geolocation not available, using default map location:",
            errorMessage
          );
          // Map will remain at the default center specified in new mapboxgl.Map()
          // This is expected behavior and not an error
        },
        {
          enableHighAccuracy: false, // Changed to false for better compatibility
          timeout: 10000, // Increased timeout to 10 seconds
          maximumAge: 300000, // Cache position for 5 minutes
        }
      );
    } else {
      console.info(
        "Geolocation is not supported by this browser, using default location."
      );
    }

    if (onMapClick) {
      map.current.on("click", (e) => {
        // Prevent placing new marker if clicking on an existing one (optional)
        // For simplicity, this is not implemented here, but could be added
        // by checking if e.originalEvent.target is part of a marker.
        onMapClick(e.lngLat);
      });
    }
  }, [onMapClick]);

  // Effect for the single draggable/clickable marker (for AddSpot)
  useEffect(() => {
    if (!map.current) return;
    if (marker) {
      if (newSpotMarkerRef.current) newSpotMarkerRef.current.remove();
      newSpotMarkerRef.current = new mapboxgl.Marker({
        color: "#06b6d4", // Theme primary color
        draggable: true,
      })
        .setLngLat(marker)
        .addTo(map.current);
      if (onMapClick) {
        // If onMapClick is provided, assume it's for setting new spot location
        newSpotMarkerRef.current.on("dragend", () => {
          const lngLat = newSpotMarkerRef.current.getLngLat();
          onMapClick(lngLat); // Update parent state on drag
        });
      }
    } else if (newSpotMarkerRef.current) {
      newSpotMarkerRef.current.remove();
      newSpotMarkerRef.current = null;
    }
  }, [marker, onMapClick]); // Added onMapClick to dependency array

  // Effect for displaying multiple spots from the spots prop
  useEffect(() => {
    if (!map.current || !spots) return;

    // Clear existing spot markers before adding new ones
    existingSpotMarkersRef.current.forEach((m) => m.remove());
    existingSpotMarkersRef.current = [];

    if (spots && spots.length > 0) {
      spots.forEach((spot) => {
        if (
          spot.location &&
          typeof spot.location.lng === "number" &&
          typeof spot.location.lat === "number"
        ) {
          let markerColor = "#94a3b8"; // Default: neutral-400
          let difficultyTextClass = "text-neutral-500";

          if (spot.difficulty) {
            const difficultyLower = spot.difficulty.toLowerCase();
            if (difficultyLower === "easy") {
              markerColor = "#10B981"; // Green-500
              difficultyTextClass = "text-green-500";
            } else if (difficultyLower === "medium") {
              markerColor = "#f59e0b"; // Amber-500 (theme accent)
              difficultyTextClass = "text-amber-500";
            } else if (difficultyLower === "hard") {
              markerColor = "#EF4444"; // Red-600
              difficultyTextClass = "text-red-600";
            }
          }

          const popupContent = `
            <div class="p-1 font-sans">
              <h3 class="text-md font-semibold text-neutral-800 mb-1">${
                spot.name
              }</h3>
              <p class="text-xs text-neutral-600">Difficulty: <span class="font-medium ${difficultyTextClass}">${
            spot.difficulty || "N/A"
          }</span></p>
              <p class="text-xs text-neutral-600">Elevation: <span class="font-medium text-neutral-700">${
                spot.elevation_gain || "N/A"
              }m</span></p>
            </div>
          `;

          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
            popupContent
          );

          const spotMarker = new mapboxgl.Marker({ color: markerColor })
            .setLngLat([spot.location.lng, spot.location.lat])
            .setPopup(popup) // sets a popup on this marker
            .addTo(map.current);
          existingSpotMarkersRef.current.push(spotMarker);
        }
      });

      // Optional: Fit map to bounds of all spots
      if (existingSpotMarkersRef.current.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        existingSpotMarkersRef.current.forEach((m) => {
          bounds.extend(m.getLngLat());
        });
        map.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
      }
    }
  }, [spots]); // Runs when spots array changes

  return (
    <div className="retro-map-container">
      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

export default Map;
