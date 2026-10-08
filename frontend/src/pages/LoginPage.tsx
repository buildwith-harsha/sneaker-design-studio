import { useState, type FormEvent, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { loginUser, clearAuthError } from "../store/authSlice";
import "../assets/css/auth.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated, loading, error } = useAppSelector(
    (state) => state.auth,
  );

  const from = (location.state as { from?: { pathname: string } })?.from
    ?.pathname || "/designs";

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setClientError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setClientError("Please enter both email and password.");
      return;
    }

    await dispatch(
      loginUser({
        email: trimmedEmail,
        password,
      }),
    );
  };

  const displayedError = clientError || error;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-badge">FORMLAB STUDIO</span>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">
            Sign in to access your sneaker designs and studio tools
          </p>
        </div>

        {displayedError && (
          <div className="auth-error-banner" role="alert">
            <span>⚠️</span>
            <span>{displayedError}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className="auth-input"
              placeholder="you@domain.com"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (clientError) setClientError(null);
              }}
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="auth-input"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (clientError) setClientError(null);
              }}
              required
            />
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="auth-footer">
          Don&apos;t have an account?
          <Link to="/register" className="auth-link">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
