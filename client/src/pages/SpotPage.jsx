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

  if (loading)
    return (
      <div className="retro-loading-container">
        <div className="retro-loading-spinner"></div>
        <p className="retro-loading-text">Loading spot...</p>
      </div>
    );

  if (error)
    return (
      <div className="retro-spot-page">
        <div className="retro-empty-state">
          <div className="retro-empty-icon">⚠️</div>
          <h3 className="retro-empty-title">Error</h3>
          <p className="retro-empty-text">Error loading spot: {error}</p>
        </div>
      </div>
    );

  if (!spot)
    return (
      <div className="retro-spot-page">
        <div className="retro-empty-state">
          <div className="retro-empty-icon">🛹</div>
          <h3 className="retro-empty-title">Not Found</h3>
          <p className="retro-empty-text">Spot not found.</p>
        </div>
      </div>
    );

  return (
    <div className="retro-spot-page">
      <Link to="/spots" className="retro-back-link">
        ← Back to All Spots
      </Link>
      <article className="retro-spot-detail">
        {spot.image_url && (
          <img
            src={spot.image_url}
            alt={`Image of ${spot.name}`}
            className="retro-spot-detail-image"
          />
        )}
        <div className="retro-spot-detail-content">
          <h1 className="retro-spot-detail-title">{spot.name}</h1>
          <p className="retro-spot-detail-description">{spot.description}</p>

          <div className="retro-spot-detail-grid">
            <div className="retro-spot-detail-section">
              <h2 className="retro-spot-detail-section-title">Details</h2>
              <ul className="retro-spot-detail-list">
                <li className="retro-spot-detail-item">
                  <span className="retro-spot-label">Difficulty:</span>{" "}
                  <span
                    className={`retro-difficulty-indicator ${
                      spot.difficulty === "Easy"
                        ? "retro-difficulty-easy"
                        : spot.difficulty === "Medium"
                        ? "retro-difficulty-medium"
                        : spot.difficulty === "Hard"
                        ? "retro-difficulty-hard"
                        : "retro-difficulty-unknown"
                    }`}
                  >
                    {spot.difficulty || "N/A"}
                  </span>
                </li>
                <li className="retro-spot-detail-item">
                  <span className="retro-spot-label">Elevation Gain:</span>{" "}
                  {spot.elevation_gain ? `${spot.elevation_gain}m` : "N/A"}
                </li>
                {spot.location_address && (
                  <li className="retro-spot-detail-item">
                    <span className="retro-spot-label">Address:</span>{" "}
                    {spot.location_address}
                  </li>
                )}
              </ul>
            </div>
            {spot.location && (
              <div className="retro-spot-detail-section">
                <h2 className="retro-spot-detail-section-title">
                  Location Coordinates
                </h2>
                <p className="retro-spot-detail-item">
                  <span className="retro-spot-label">Latitude:</span>{" "}
                  {spot.location.lat}
                </p>
                <p className="retro-spot-detail-item">
                  <span className="retro-spot-label">Longitude:</span>{" "}
                  {spot.location.lng}
                </p>
                {/* 
                  Future enhancement: Integrate Map component
                  <div className="mt-4 h-64 rounded-md overflow-hidden">
                    <Map spots={[spot]} defaultZoom={13} />
                  </div>
                */}
              </div>
            )}
          </div>

          <div className="retro-spot-detail-footer">
            <p className="retro-spot-detail-date">
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
