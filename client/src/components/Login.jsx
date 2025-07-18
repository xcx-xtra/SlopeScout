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
    <div className="retro-auth-container">
      <div className="retro-auth-card">
        <div className="retro-auth-header">
          <h2 className="retro-auth-title">Login</h2>
          <p className="retro-auth-subtitle">Welcome back, skater!</p>
        </div>
        <form onSubmit={handleLogin} className="retro-auth-form">
          <input type="hidden" name="remember" defaultValue="true" />
          <div className="retro-form-group">
            <label htmlFor="email-address" className="retro-form-label">
              Email
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="retro-form-input"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="retro-form-group">
            <label htmlFor="password" className="retro-form-label">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="retro-form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
                <FiLogIn className="retro-btn-icon" />
                Login
              </>
            )}
          </button>

          <div className="retro-auth-links">
            <Link to="/forgot-password" className="retro-auth-link">
              Forgot Password?
            </Link>
          </div>
        </form>

        <div className="retro-auth-divider">
          <span>Don't have an account?</span>
        </div>

        <Link to="/register" className="retro-btn-secondary">
          Sign Up
        </Link>
      </div>
    </div>
  );
};

export default Login;
