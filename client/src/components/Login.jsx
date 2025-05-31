import { useState } from "react";
import supabase from "../supabaseClient";
import { toast } from "react-toastify";
import { FiLogIn, FiLoader } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom"; // Import Link and useNavigate

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
      <div className="max-w-xs w-full space-y-8">
        {" "}
        {/* Adjusted max-w-xs for a narrower form like the wireframe */}
        <div className="text-center">
          <h2 className="text-xl font-semibold text-neutral-800">Login</h2>{" "}
          {/* Adjusted text size */}
        </div>
        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          <input type="hidden" name="remember" defaultValue="true" />
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                {" "}
                {/* Label made screen-reader only as per wireframe */}
                Email
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-neutral-300 placeholder-neutral-500 text-neutral-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                {" "}
                {/* Label made screen-reader only */}
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-neutral-300 placeholder-neutral-500 text-neutral-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white transition-colors duration-150 ease-in-out ${
                loading
                  ? "bg-neutral-400 cursor-not-allowed"
                  : "bg-neutral-700 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500"
              }`}
            >
              {loading ? (
                <FiLoader className="animate-spin h-5 w-5 text-white" />
              ) : (
                "Login"
              )}
            </button>
          </div>
          <div className="text-sm text-center">
            <Link
              to="/forgot-password" // Assuming you will create this route
              className="font-medium text-neutral-600 hover:text-neutral-500"
            >
              Forgot Password?
            </Link>
          </div>
        </form>
        <div className="mt-6">
          <Link
            to="/register"
            className="group relative w-full flex justify-center py-3 px-4 border border-neutral-300 text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
