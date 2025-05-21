import { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken =
  "pk.eyJ1IjoieGN4LXh0cmEiLCJhIjoiY21heGh2MG56MGFkdjJzb3A5cWlmbmtiaCJ9.LoM-z-6BvavCtV3PP7KkvA"; // Replace with your real token

const Map = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [-74.5, 40],
      zoom: 9,
    });
  }, []);

  return (
    <div
      ref={mapContainer}
      className="w-full h-96 rounded border border-gray-300 shadow"
    />
  );
};

export default Map;
