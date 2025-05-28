import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
// import Map from '../components/Map'; // Future enhancement: You might want to integrate your Map component

const SpotPage = () => {
  const { spotId } = useParams();
  const [spot, setSpot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSpot = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/spots/${spotId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `HTTP error! status: ${response.status}`
          );
        }
        const data = await response.json();
        setSpot(data);
      } catch (e) {
        console.error("Failed to fetch spot:", e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    if (spotId) {
      fetchSpot();
    }
  }, [spotId]);

  if (loading) return <LoadingSpinner />;
  if (error)
    return (
      <div className="text-red-500 text-center p-4">
        Error loading spot: {error}
      </div>
    );
  if (!spot) return <div className="text-center p-4">Spot not found.</div>;

  return (
    <div className="container mx-auto p-4 antialiased">
      <Link
        to="/spots"
        className="text-blue-600 hover:text-blue-800 visited:text-purple-600 hover:underline mb-6 inline-block transition duration-150 ease-in-out"
      >
        &larr; Back to All Spots
      </Link>
      <article className="bg-white shadow-xl rounded-lg overflow-hidden">
        {spot.image_url && (
          <img
            src={spot.image_url}
            alt={`Image of ${spot.name}`}
            className="w-full h-72 object-cover"
          />
        )}
        <div className="p-6 md:p-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">{spot.name}</h1>
          <p className="text-gray-600 text-lg mb-6">{spot.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Details
              </h2>
              <ul className="space-y-2 text-gray-600">
                <li>
                  <span className="font-medium">Difficulty:</span>{" "}
                  {spot.difficulty || "N/A"}
                </li>
                <li>
                  <span className="font-medium">Elevation Gain:</span>{" "}
                  {spot.elevation_gain ? `${spot.elevation_gain}m` : "N/A"}
                </li>
                {spot.location_address && (
                  <li>
                    <span className="font-medium">Address:</span>{" "}
                    {spot.location_address}
                  </li>
                )}
              </ul>
            </div>
            {spot.location && (
              <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-2">
                  Location Coordinates
                </h2>
                <p className="text-gray-600">Latitude: {spot.location.lat}</p>
                <p className="text-gray-600">Longitude: {spot.location.lng}</p>
                {/* 
                  Future enhancement: Integrate Map component
                  <div className="mt-4 h-64 rounded-md overflow-hidden">
                    <Map spots={[spot]} defaultZoom={13} />
                  </div>
                */}
              </div>
            )}
          </div>

          <div className="text-sm text-gray-500 border-t pt-4 mt-6">
            <p>
              Spot added on:{" "}
              {new Date(spot.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </article>
    </div>
  );
};

export default SpotPage;
