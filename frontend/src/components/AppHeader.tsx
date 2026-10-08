import { NavLink, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logout } from "../store/authSlice";
import { clearCachedDesigns } from "../utils/designStorage";
import "../assets/css/header.css";

function AppHeader() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    clearCachedDesigns();
    navigate("/login");
  };

  const getInitial = (name?: string) => {
    return name ? name.trim().charAt(0).toUpperCase() : "U";
  };

  return (
    <header className="app-header">
      <div className="app-header__container">
        <NavLink
          to={isAuthenticated ? "/studio" : "/"}
          className="app-header__brand"
          aria-label="FORM LAB Sneaker Studio"
        >
          FORM<span className="app-header__brand-lab">LAB</span>
        </NavLink>

        {isAuthenticated && (
          <nav className="app-header__nav" aria-label="Main navigation">
            <NavLink
              to="/studio"
              className={({ isActive }) =>
                `app-header__link ${isActive ? "app-header__link--active" : ""}`
              }
            >
              🎨 Studio
            </NavLink>

            <NavLink
              to="/designs"
              className={({ isActive }) =>
                `app-header__link ${isActive ? "app-header__link--active" : ""}`
              }
            >
              👟 My Collection
            </NavLink>
          </nav>
        )}

        <div className="app-header__auth">
          {isAuthenticated ? (
            <>
              <div className="app-header__user-tag" title={user?.email}>
                <span className="app-header__user-avatar">
                  {getInitial(user?.name)}
                </span>
                <span className="app-header__user-name">
                  {user?.name || "Designer"}
                </span>
              </div>
              <button
                type="button"
                className="app-header__btn app-header__btn--logout"
                onClick={handleLogout}
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="app-header__btn">
                Log In
              </NavLink>
              <NavLink
                to="/register"
                className="app-header__btn app-header__btn--primary"
              >
                Create Account
              </NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
