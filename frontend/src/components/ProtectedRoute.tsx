import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import "../assets/css/auth.css";

interface ProtectedRouteProps {
  children?: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading, initialAuthChecked } = useAppSelector(
    (state) => state.auth,
  );
  const location = useLocation();

  if (!initialAuthChecked || (loading && !isAuthenticated)) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-spinner" />
        <p>Verifying authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : null;
}
