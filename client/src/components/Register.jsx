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
    <div className="retro-auth-container">
      <div className="retro-auth-card">
        <div className="retro-auth-header">
          <h2 className="retro-auth-title">Join the Crew</h2>
          <p className="retro-auth-subtitle">Create your SlopeScout account</p>
        </div>
        <form onSubmit={handleRegister} className="retro-auth-form">
          <input type="hidden" name="remember" defaultValue="true" />
          <div className="retro-form-group">
            <label
              htmlFor="email-address-register"
              className="retro-form-label"
            >
              Email Address
            </label>
            <input
              id="email-address-register"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="retro-form-input"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="retro-form-group">
            <label htmlFor="password-register" className="retro-form-label">
              Password
            </label>
            <input
              id="password-register"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className="retro-form-input"
              placeholder="Password (min. 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="retro-form-group">
            <label
              htmlFor="confirm-password-register"
              className="retro-form-label"
            >
              Confirm Password
            </label>
            <input
              id="confirm-password-register"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              className="retro-form-input"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`retro-btn-auth ${loading ? "loading" : ""}`}
          >
            {loading ? (
              <FiLoader className="retro-loading-icon" />
            ) : (
              <>
                <FiUserPlus className="retro-btn-icon" />
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="retro-auth-divider">
          <span>Already have an account?</span>
        </div>

        <a href="/login" className="retro-btn-secondary">
          Sign In
        </a>
      </div>
    </div>
  );
};

export default Register;
