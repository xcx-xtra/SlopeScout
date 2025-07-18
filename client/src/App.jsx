import { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  NavLink,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import Map from "./components/Map";
import Login from "./components/Login";
import Register from "./components/Register";
import { AddSpot, EditSpot, ManageSpots, SpotList } from "./pages/Spots";
import Profile from "./pages/Profile";
import SpotPage from "./pages/SpotPage";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <Router>
      <div className="retro-app retro-gpu-accelerated">
        <nav
          className="retro-nav retro-contain-layout"
          role="navigation"
          aria-label="Main navigation"
        >
          <div className="retro-nav-container">
            <Link to="/" className="retro-logo" aria-label="SlopeScout - Home">
              SlopeScout
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`retro-mobile-menu-btn ${
                isMobileMenuOpen ? "open" : ""
              }`}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16m-7 6h7"
                  />
                )}
              </svg>
            </button>
            {/* Desktop Menu */}
            <div className="retro-nav-desktop">
              <ul className="retro-nav-links">
                <li>
                  <NavLink
                    to="/"
                    className={({ isActive }) =>
                      `retro-nav-link ${isActive ? "active" : ""}`
                    }
                  >
                    Home
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/add-spot"
                    className={({ isActive }) =>
                      `retro-nav-link ${isActive ? "active" : ""}`
                    }
                  >
                    Add Spot
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/profile"
                    className={({ isActive }) =>
                      `retro-nav-link ${isActive ? "active" : ""}`
                    }
                  >
                    Profile
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/manage-spots"
                    className={({ isActive }) =>
                      `retro-nav-link ${isActive ? "active" : ""}`
                    }
                  >
                    My Spots
                  </NavLink>
                </li>
              </ul>
              <div className="retro-auth-buttons">
                <Link to="/login" className="retro-btn-login">
                  Login
                </Link>
                <Link to="/register" className="retro-btn-register">
                  Register
                </Link>
              </div>
            </div>
          </div>
          {/* Mobile Menu */}
          <div
            id="mobile-menu"
            className={`retro-mobile-menu ${isMobileMenuOpen ? "open" : ""}`}
            role="menu"
            aria-hidden={!isMobileMenuOpen}
          >
            <div className="retro-mobile-nav-links">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `retro-mobile-nav-link ${isActive ? "active" : ""}`
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </NavLink>
              <NavLink
                to="/add-spot"
                className={({ isActive }) =>
                  `retro-mobile-nav-link ${isActive ? "active" : ""}`
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Add Spot
              </NavLink>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `retro-mobile-nav-link ${isActive ? "active" : ""}`
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Profile
              </NavLink>
              <NavLink
                to="/manage-spots"
                className={({ isActive }) =>
                  `retro-mobile-nav-link ${isActive ? "active" : ""}`
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                My Spots
              </NavLink>
            </div>
            <div className="retro-mobile-auth">
              <Link
                to="/login"
                className="retro-mobile-btn-login"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="retro-mobile-btn-register"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Register
              </Link>
            </div>
          </div>
        </nav>
        <main
          id="main-content"
          className={`retro-main ${isMobileMenuOpen ? "mobile-menu-open" : ""}`}
          role="main"
        >
          <ErrorBoundary>
            <Routes>
              <Route
                path="/"
                element={
                  <div className="retro-home">
                    <h1 className="retro-home-title">Welcome to SlopeScout!</h1>
                    <p className="retro-home-subtitle">
                      Discover and share the best skating spots around.
                    </p>
                    <div className="retro-map-container">
                      <Map spots={[]} />{" "}
                      {/* Example: Pass empty spots or fetch featured spots */}
                    </div>
                    {/* Removed SpotForm from home, assuming it's mainly for adding spots */}
                    <div className="retro-home-cta">
                      <Link to="/spots" className="retro-btn-primary">
                        Explore Spots
                      </Link>
                    </div>
                  </div>
                }
              />
              <Route path="/spots" element={<SpotList />} />
              <Route path="/add-spot" element={<AddSpot />} />
              <Route path="/spots/:spotId" element={<SpotPage />} />
              <Route path="/spots/:id/edit" element={<EditSpot />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/manage-spots" element={<ManageSpots />} />
              <Route path="/login" element={<Login />} />{" "}
              {/* Ensure Login route exists */}
              <Route path="/register" element={<Register />} />{" "}
              {/* Ensure Register route exists */}
            </Routes>
          </ErrorBoundary>
        </main>
        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </Router>
  );
}

export default App;
