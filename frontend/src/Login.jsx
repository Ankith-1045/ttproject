
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api/axios";
import {
  Leaf,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";
import "./App.css";

function App() {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "receiver",
  });

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      if (isLogin) {
        const response = await api.post("/auth/login", {
          email: form.email,
          password: form.password,
        });

        localStorage.setItem(
          "nourishnetToken",
          response.data.token
        );

        localStorage.setItem(
          "nourishnetUser",
          JSON.stringify(response.data.user)
        );

    
const loggedInUser = response.data.user;

if (loggedInUser.role === "receiver") {
  navigate("/dashboard", { replace: true });
} else if (loggedInUser.role === "donor") {
  navigate("/donor-dashboard", { replace: true });
} else {
  setError("Unknown account role. Please contact support.");
}

      } else {
        await api.post("/auth/register", form);

        setMessage(
          "Account created successfully! You can now log in."
        );

        setIsLogin(true);

        setForm({
          name: "",
          email: form.email,
          password: "",
          role: "receiver",
        });
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (loginMode) => {
    setIsLogin(loginMode);
    setMessage("");
    setError("");
    setShowPassword(false);
  };

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <div className="brand">
          <span className="brand-icon">
            <Leaf size={25} />
          </span>
          <span>NourishNet</span>
        </div>

        <div className="visual-content">
          <span className="eyebrow">
            GOOD FOOD. GREATER GOOD.
          </span>

          <h1>
            Share food.
            <br />
            Spread hope.
          </h1>

          <p>
            Every meal shared is a step toward a world without hunger.
            Connect surplus food with people who need it.
          </p>

          <div className="visual-stats">
            <div>
              <strong>Reduce</strong>
              <span>Food waste</span>
            </div>

            <div>
              <strong>Support</strong>
              <span>Communities</span>
            </div>

            <div>
              <strong>Build</strong>
              <span>A better future</span>
            </div>
          </div>
        </div>

        <p className="visual-footer">
          Small acts. Meaningful impact.
        </p>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="mobile-brand">
            <Leaf size={24} />
            NourishNet
          </div>

          <div className="form-heading">
            <span className="form-label">
              {isLogin ? "WELCOME BACK" : "JOIN OUR COMMUNITY"}
            </span>

            <h2>
              {isLogin
                ? "Sign in to NourishNet"
                : "Create your account"}
            </h2>

            <p>
              {isLogin
                ? "Continue making a difference, one meal at a time."
                : "Be part of a community that believes food should never go to waste."}
            </p>
          </div>

          <div className="auth-tabs">
            <button
              type="button"
              className={isLogin ? "active" : ""}
              onClick={() => switchMode(true)}
            >
              Sign in
            </button>

            <button
              type="button"
              className={!isLogin ? "active" : ""}
              onClick={() => switchMode(false)}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <label htmlFor="name">Full name</label>

                <div className="input-wrap">
                  <User size={18} />

                  <input
                    id="name"
                    name="name"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={handleChange}
                    autoComplete="name"
                    required
                  />
                </div>
              </>
            )}

            <label htmlFor="email">Email address</label>

            <div className="input-wrap">
              <Mail size={18} />

              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>

            <label htmlFor="password">Password</label>

            <div className="input-wrap">
              <Lock size={18} />

              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                autoComplete={
                  isLogin ? "current-password" : "new-password"
                }
                minLength={6}
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword((previous) => !previous)
                }
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>

            {!isLogin && (
              <>
               
<label htmlFor="role">
  I want to join as a
</label>

<select
  id="role"
  name="role"
  value={form.role}
  onChange={handleChange}
>
  <option value="receiver">NGO</option>
  <option value="donor">Food donor</option>
</select>

              </>
            )}

            {error && (
              <p className="form-message error" role="alert">
                {error}
              </p>
            )}

            {message && (
              <p className="form-message success" role="status">
                {message}
              </p>
            )}

            <button
              className="submit-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : isLogin
                  ? "Sign in"
                  : "Create account"}

              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="form-note">
            {isLogin
              ? "New to NourishNet?"
              : "Already have an account?"}{" "}

            <button
              type="button"
              onClick={() => switchMode(!isLogin)}
            >
              {isLogin ? "Join us" : "Sign in"}
            </button>
          </p>

          <p className="copyright">
            © 2026 NourishNet · Together against food waste
          </p>
        </div>
      </section>
    </main>
  );
}

export default App;
