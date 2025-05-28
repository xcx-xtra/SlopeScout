import { useState } from "react";
import supabase from "../supabaseClient";
import { toast } from "react-toastify"; // Import toast
import { FiUserPlus, FiLoader } from "react-icons/fi"; // Import icons

const Register = ({ onRegister }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // Added confirmPassword state
  const [loading, setLoading] = useState(false); // Added loading state

  const handleRegister = async (e) => {
    e.preventDefault();
    toast.dismiss(); // Dismiss any existing toasts

    // Client-side validation
    if (!email.trim()) {
      toast.error("Email is required.");
      return;
    }
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!password) {
      toast.error("Password is required.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (error) {
      toast.error(error.message || "Registration failed. Please try again.");
    } else {
      toast.success(
        "Registration successful! Check your email for a confirmation link."
      );
      if (onRegister) onRegister(); // Callback if provided
      // Optionally clear form fields or redirect
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-primary-700 dark:text-primary-300 font-serif">
            Create your SlopeScout Account
          </h2>
        </div>
        <form
          onSubmit={handleRegister}
          className="mt-8 space-y-6 bg-white dark:bg-neutral-800 p-8 shadow-2xl rounded-lg"
        >
          <input type="hidden" name="remember" defaultValue="true" />
          <div className="rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address-register" className="sr-only">
                Email address
              </label>
              <input
                id="email-address-register"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-neutral-300 dark:border-neutral-700 placeholder-neutral-500 dark:placeholder-neutral-400 text-neutral-900 dark:text-neutral-100 rounded-t-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400 focus:z-10 sm:text-sm dark:bg-neutral-700"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="-mt-px">
              {" "}
              {/* Adjusted for better border overlap */}
              <label htmlFor="password-register" className="sr-only">
                Password
              </label>
              <input
                id="password-register"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-neutral-300 dark:border-neutral-700 placeholder-neutral-500 dark:placeholder-neutral-400 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400 focus:z-10 sm:text-sm dark:bg-neutral-700"
                placeholder="Password (min. 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="-mt-px">
              {" "}
              {/* Adjusted for better border overlap */}
              <label htmlFor="confirm-password-register" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirm-password-register"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-neutral-300 dark:border-neutral-700 placeholder-neutral-500 dark:placeholder-neutral-400 text-neutral-900 dark:text-neutral-100 rounded-b-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400 focus:z-10 sm:text-sm dark:bg-neutral-700"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex items-center justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white transition-colors duration-150 ease-in-out ${
                loading
                  ? "bg-accent-400 dark:bg-accent-500 cursor-not-allowed"
                  : "bg-accent-500 hover:bg-accent-600 dark:bg-accent-600 dark:hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-100 dark:focus:ring-offset-neutral-900 focus:ring-accent-500 dark:focus:ring-accent-400"
              }`}
            >
              {loading ? (
                <FiLoader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
              ) : (
                <FiUserPlus className="-ml-1 mr-3 h-5 w-5 text-white" />
              )}
              {loading ? "Creating account..." : "Create account"}
            </button>
          </div>
          <div className="text-sm text-center">
            <p className="text-neutral-600 dark:text-neutral-400">
              Already have an account?{" "}
              <a
                href="/login" // Assuming you have a route for login
                className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Sign in
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
