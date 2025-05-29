import { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  NavLink,
} from "react-router-dom"; // Import NavLink
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import Map from "./components/Map";
import Login from "./components/Login";
import Register from "./components/Register";
import SpotForm from "./components/SpotForm";
import {
  AddSpot,
  SpotDetail,
  EditSpot,
  ManageSpots,
  SpotList,
} from "./pages/Spots"; // Added ManageSpots and SpotList
import Profile from "./pages/Profile"; // Import the Profile component
import SpotPage from "./pages/SpotPage"; // Import SpotPage
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  const [count, setCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Define reusable Tailwind classes for navigation links
  const navLinkClasses =
    "text-neutral-300 hover:text-white hover:bg-primary transition-colors px-3 py-2 rounded-md text-sm font-medium";
  const activeNavLinkClasses =
    "bg-primary text-white px-3 py-2 rounded-md text-sm font-medium";
  const mobileNavLinkClasses =
    "block px-3 py-2 rounded-md text-base font-medium text-neutral-300 hover:bg-primary hover:text-white transition-colors";
  const mobileActiveNavLinkClasses =
    "block px-3 py-2 rounded-md text-base font-medium bg-primary text-white";

  return (
    <Router>
      <div className="App min-h-screen flex flex-col bg-neutral-100 dark:bg-neutral-900 font-sans">
        <nav className="bg-primary-dark text-white shadow-lg">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
            <Link
              to="/"
              className="text-2xl font-bold text-white hover:text-accent-300 transition-colors duration-150 ease-in-out"
            >
              SlopeScout
            </Link>
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-white focus:outline-none p-2 rounded-md hover:bg-primary focus:bg-primary transition-colors duration-150 ease-in-out"
              >
                <svg
                  className="w-6 h-6"
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
            </div>
            {/* Desktop Menu */}
            <ul className="hidden md:flex space-x-2 items-center">
              <li>
                <NavLink // Changed to NavLink
                  to="/"
                  className={({ isActive }) =>
                    isActive ? activeNavLinkClasses : navLinkClasses
                  }
                >
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink // Changed to NavLink
                  to="/add-spot"
                  className={({ isActive }) =>
                    isActive ? activeNavLinkClasses : navLinkClasses
                  }
                >
                  Add Spot
                </NavLink>
              </li>
              <li>
                <NavLink // Changed to NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    isActive ? activeNavLinkClasses : navLinkClasses
                  }
                >
                  Profile
                </NavLink>
              </li>
              <li>
                <NavLink // Changed to NavLink
                  to="/manage-spots"
                  className={({ isActive }) =>
                    isActive ? activeNavLinkClasses : navLinkClasses
                  }
                >
                  My Spots
                </NavLink>
              </li>
              <li className="ml-4">
                <Link
                  to="/login"
                  className="bg-accent-500 hover:bg-accent-600 text-white px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-150 ease-in-out shadow-md hover:shadow-lg"
                >
                  Login
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="border border-accent-500 text-accent-300 hover:bg-accent-500 hover:text-white px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-150 ease-in-out shadow-md hover:shadow-lg"
                >
                  Register
                </Link>
              </li>
            </ul>
          </div>
          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden absolute top-16 inset-x-0 bg-primary-dark p-2 space-y-1 sm:px-3 z-50 shadow-xl rounded-b-lg">
              <NavLink // Changed to NavLink
                to="/"
                className={({ isActive }) =>
                  isActive ? mobileActiveNavLinkClasses : mobileNavLinkClasses
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </NavLink>
              <NavLink // Changed to NavLink
                to="/add-spot"
                className={({ isActive }) =>
                  isActive ? mobileActiveNavLinkClasses : mobileNavLinkClasses
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Add Spot
              </NavLink>
              <NavLink // Changed to NavLink
                to="/profile"
                className={({ isActive }) =>
                  isActive ? mobileActiveNavLinkClasses : mobileNavLinkClasses
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Profile
              </NavLink>
              <NavLink // Changed to NavLink
                to="/manage-spots"
                className={({ isActive }) =>
                  isActive ? mobileActiveNavLinkClasses : mobileNavLinkClasses
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                My Spots
              </NavLink>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="block w-full text-center px-3 py-2 rounded-md text-base font-medium text-white bg-accent-500 hover:bg-accent-600 transition-colors duration-150 ease-in-out shadow-md hover:shadow-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
              </div>
              <div className="pt-1">
                <Link
                  to="/register"
                  className="block w-full text-center px-3 py-2 rounded-md text-base font-medium text-accent-300 border border-accent-500 hover:bg-accent-500 hover:text-white transition-colors duration-150 ease-in-out shadow-md hover:shadow-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Register
                </Link>
              </div>
            </div>
          )}
        </nav>
        <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
          <ErrorBoundary>
            <Routes>
              <Route
                path="/"
                element={
                  <div className="text-center py-10">
                    <h1 className="text-4xl font-bold text-primary-dark mb-4 font-serif">
                      Welcome to SlopeScout!
                    </h1>
                    <p className="text-lg text-neutral-600 mb-8">
                      Discover and share the best skating spots around.
                    </p>
                    <div className="my-8 shadow-xl rounded-lg overflow-hidden w-full">
                      <Map spots={[]} />{" "}
                      {/* Example: Pass empty spots or fetch featured spots */}
                    </div>
                    {/* Removed SpotForm from home, assuming it's mainly for adding spots */}
                    <div className="mt-12">
                      <Link
                        to="/spots"
                        className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors shadow-md hover:shadow-lg"
                      >
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
