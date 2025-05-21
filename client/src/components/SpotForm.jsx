import { useState } from "react";
import axios from "axios";

const SpotForm = () => {
  const [name, setName] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [elevation, setElevation] = useState("");
  const [result, setResult] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult("");
    try {
      const res = await axios.post("http://localhost:3001/api/spots", {
        name,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        elevation: parseFloat(elevation),
      });
      setResult(res.data);
    } catch (err) {
      setResult(err.response?.data || "Error submitting spot");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto p-4 bg-white rounded shadow my-8"
    >
      <h2 className="text-xl font-bold mb-4">Submit a Spot</h2>
      <input
        className="block w-full mb-2 p-2 border rounded"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        className="block w-full mb-2 p-2 border rounded"
        placeholder="Latitude"
        value={lat}
        onChange={(e) => setLat(e.target.value)}
        required
        type="number"
        step="any"
      />
      <input
        className="block w-full mb-2 p-2 border rounded"
        placeholder="Longitude"
        value={lng}
        onChange={(e) => setLng(e.target.value)}
        required
        type="number"
        step="any"
      />
      <input
        className="block w-full mb-2 p-2 border rounded"
        placeholder="Elevation"
        value={elevation}
        onChange={(e) => setElevation(e.target.value)}
        required
        type="number"
        step="any"
      />
      <button
        className="w-full bg-blue-600 text-white p-2 rounded"
        type="submit"
      >
        Submit
      </button>
      {result && <div className="mt-2 text-green-600">{result}</div>}
    </form>
  );
};

export default SpotForm;
