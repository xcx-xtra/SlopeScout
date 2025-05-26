import { useState } from "react";
import supabase from "../supabaseClient";
import { toast } from "react-toastify";
import { FiLogIn, FiLoader } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom"; // Import Link and useNavigate

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate

  const handleLogin = async (e) => {
    e.preventDefault();
    // Basic client-side validation
    if (!email.trim()) {
      toast.error("Email is required.");
      return;
    }
    if (!password) {
      toast.error("Password is required.");
      return;
    }
    // Email format validation (simple regex)
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    toast.dismiss(); // Dismiss any existing toasts

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      toast.error(
        error.message || "Login failed. Please check your credentials."
      );
    } else {
      toast.success("Logged in successfully!");
      if (onLogin) onLogin(data.session); // Pass the whole session object
      navigate("/"); // Redirect to home page on successful login
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-neutral-800">Login</h2>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label
              htmlFor="email-address"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Email
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="appearance-none block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end">
            <div className="text-sm">
              <Link
                to="/forgot-password" // Update if you have a forgot password route
                className="font-medium text-neutral-600 hover:text-neutral-500"
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors duration-150 ease-in-out ${
                loading
                  ? "bg-neutral-400 cursor-not-allowed"
                  : "bg-neutral-700 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500"
              }`}
            >
              {loading ? (
                <FiLoader className="animate-spin -ml-1 mr-2 h-5 w-5" />
              ) : // No icon for login button as per wireframe
              null}
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>
        <div className="text-center mt-4">
          <Link
            to="/register"
            className="w-full flex items-center justify-center py-2.5 px-4 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
