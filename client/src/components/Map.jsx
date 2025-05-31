import { useRef, useEffect, useState } from "react"; // Added useState
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
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12", // Changed to satellite streets style
      center: [-74.5, 40], // Default center
      zoom: 9, // Default zoom
      pitch: 45, // Added initial pitch for a 3D perspective
      bearing: -17.6, // Added initial bearing
      antialias: true, // Improves rendering quality
    });

    map.current.on("load", () => {
      map.current.addSource("mapbox-dem", {
        type: "raster-dem",
        url: "mapbox://mapbox.mapbox-terrain-dem-v1",
        tileSize: 512,
        maxzoom: 14,
      });
      map.current.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 }); // Enables 3D terrain

      // Add sky layer for a more realistic 3D effect
      map.current.addLayer({
        id: "sky",
        type: "sky",
        paint: {
          "sky-type": "atmosphere",
          "sky-atmosphere-sun": [0.0, 0.0],
          "sky-atmosphere-sun-intensity": 1,
        },
      });
    });

    // Attempt to set map center to user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (map.current) {
            const { latitude, longitude } = position.coords;
            map.current.setCenter([longitude, latitude]);
            map.current.setZoom(13); // Optionally set a closer zoom level
          }
        },
        (error) => {
          console.warn(
            "Error getting user location for map default:",
            error.message
          );
          // Map will remain at the default center specified in new mapboxgl.Map()
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      console.warn("Geolocation is not supported by this browser.");
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

  const difficultyColors = {
    Easy: "#10B981", // Green-500
    Medium: "#f59e0b", // Amber-500 (theme accent)
    Hard: "#EF4444", // Red-600
    Unknown: "#94a3b8", // neutral-400
  };

  return (
    <div className="relative flex justify-center items-center w-full min-h-[300px] sm:min-h-[400px] md:min-h-[500px] p-4 bg-neutral-100 dark:bg-neutral-800">
      <div
        ref={mapContainer}
        className="w-full max-w-4xl h-[300px] sm:h-[400px] md:h-[500px] rounded-lg border border-neutral-300 dark:border-neutral-700 shadow-lg bg-neutral-100 dark:bg-neutral-800"
      />
      {/* Difficulty Legend Removed */}
    </div>
  );
};

export default Map;
