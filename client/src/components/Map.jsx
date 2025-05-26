import { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken =
  "pk.eyJ1IjoieGN4LXh0cmEiLCJhIjoiY21heGh2MG56MGFkdjJzb3A5cWlmbmtiaCJ9.LoM-z-6BvavCtV3PP7KkvA"; // Replace with your real token

const Map = ({ onMapClick, marker }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (map.current) return;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [-74.5, 40],
      zoom: 9,
    });
    if (onMapClick) {
      map.current.on("click", (e) => {
        onMapClick(e.lngLat);
      });
    }
  }, [onMapClick]);

  useEffect(() => {
    if (!map.current) return;
    if (marker) {
      if (markerRef.current) markerRef.current.remove();
      markerRef.current = new mapboxgl.Marker()
        .setLngLat(marker)
        .addTo(map.current);
    } else if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
  }, [marker]);

  return (
    <div className="flex justify-center items-center w-full min-h-[400px]">
      <div
        ref={mapContainer}
        className="w-full max-w-3xl h-[400px] rounded border border-gray-300 shadow"
      />
    </div>
  );
};

export default Map;
