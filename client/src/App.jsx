import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import Map from "./components/Map";
import Login from "./components/Login";
import Register from "./components/Register";
import SpotForm from "./components/SpotForm";
import { AddSpot, SpotList, SpotDetail, EditSpot } from "./pages/Spots";
import Profile from "./pages/Profile"; // Import the Profile component
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  const [count, setCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <Router>
      <div className="App min-h-screen flex flex-col bg-neutral-100 font-sans">
        <nav className="bg-primary-dark text-white shadow-md">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
            <Link
              to="/"
              className="text-2xl font-bold hover:text-primary-light transition-colors"
            >
              SlopeScout
            </Link>
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-white focus:outline-none p-2 rounded-md hover:bg-primary-dark focus:bg-primary-dark"
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
            <ul className="hidden md:flex space-x-4 items-center">
              <li>
                <Link
                  to="/"
                  className="hover:text-primary-light transition-colors px-3 py-2 rounded-md text-sm font-medium"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/spots"
                  className="hover:text-primary-light transition-colors px-3 py-2 rounded-md text-sm font-medium"
                >
                  Spots
                </Link>
              </li>
              <li>
                <Link
                  to="/add-spot"
                  className="hover:text-primary-light transition-colors px-3 py-2 rounded-md text-sm font-medium"
                >
                  Add Spot
                </Link>
              </li>
              <li>
                <Link
                  to="/profile"
                  className="hover:text-primary-light transition-colors px-3 py-2 rounded-md text-sm font-medium"
                >
                  Profile
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="bg-accent-500 hover:bg-accent-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Login
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="border border-primary-light hover:bg-primary-light hover:text-primary-dark text-primary-light px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Register
                </Link>
              </li>
            </ul>
          </div>
          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden absolute top-16 inset-x-0 bg-primary-dark p-2 space-y-1 sm:px-3 z-50 shadow-lg">
              <Link
                to="/"
                className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-primary hover:text-white transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/spots"
                className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-primary hover:text-white transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Spots
              </Link>
              <Link
                to="/add-spot"
                className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-primary hover:text-white transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Add Spot
              </Link>
              <Link
                to="/profile"
                className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-primary hover:text-white transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Profile
              </Link>
              <Link
                to="/login"
                className="block px-3 py-2 rounded-md text-base font-medium text-white bg-accent-500 hover:bg-accent-600 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="block px-3 py-2 rounded-md text-base font-medium text-primary-light border border-primary-light hover:bg-primary-light hover:text-primary-dark transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Register
              </Link>
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
              <Route path="/add-spot" element={<AddSpot />} />{" "}
              {/* Changed from /spots/add */}
              <Route path="/spots" element={<SpotList />} />
              <Route path="/spots/:id" element={<SpotDetail />} />
              <Route path="/spots/:id/edit" element={<EditSpot />} />
              <Route path="/login" element={<Login onLogin={() => {}} />} />
              <Route
                path="/register"
                element={<Register onRegister={() => {}} />}
              />
              <Route path="/profile" element={<Profile />} />{" "}
              {/* Add this line */}
              {/* <Route path="/page" element={<Page />} /> */}
            </Routes>
          </ErrorBoundary>
        </main>
        <footer className="bg-neutral-800 text-neutral-300 p-4 text-center text-sm">
          <p>
            &copy; {new Date().getFullYear()} SlopeScout. All rights reserved.
          </p>
          <p className="text-xs text-neutral-500">Crafted with 🛹 and 💻</p>
        </footer>
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
