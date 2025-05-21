import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import Map from "./components/Map";
import Login from "./components/Login";
import Register from "./components/Register";

function App() {
  const [count, setCount] = useState(0);

  return (
    <Router>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      <nav className="flex gap-4 p-4 bg-gray-100 mb-6">
        <Link to="/" className="text-blue-600 hover:underline">
          Home
        </Link>
        <Link to="/login" className="text-blue-600 hover:underline">
          Login
        </Link>
        <Link to="/register" className="text-blue-600 hover:underline">
          Register
        </Link>
      </nav>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <h1 className="text-3xl font-bold underline text-blue-500">
                Hello World, Tailwind is working!
              </h1>
              <div className="my-8">
                <Map />
              </div>
            </>
          }
        />
        <Route path="/login" element={<Login onLogin={() => {}} />} />
        <Route path="/register" element={<Register onRegister={() => {}} />} />
      </Routes>
    </Router>
  );
}

export default App;
