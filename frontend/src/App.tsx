import { useEffect } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import AppHeader from "./components/AppHeader";
import DesignEditor from "./components/DesignEditor";
import MyDesigns from "./components/MyDesigns";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAppDispatch } from "./store/hooks";
import { checkAuth, logout } from "./store/authSlice";

// Legacy redirect helper for /designs/:id -> /studio/:id
function LegacyDesignRedirect() {
  const { id } = useParams();
  return <Navigate to={`/studio/${id}`} replace />;
}

function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Check existing auth session on app boot
    dispatch(checkAuth());

    // Listen for unauthorized 401 events from Axios interceptor
    const handleUnauthorized = () => {
      dispatch(logout());
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, [dispatch]);

  return (
    <>
      <AppHeader />

      <Routes>
        {/* Public Authentication Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Professional Studio & Collection Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Navigate to="/studio" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/studio"
          element={
            <ProtectedRoute>
              <DesignEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/studio/:id"
          element={
            <ProtectedRoute>
              <DesignEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/designs"
          element={
            <ProtectedRoute>
              <MyDesigns />
            </ProtectedRoute>
          }
        />

        {/* Backward Compatibility Redirects */}
        <Route path="/designs/new" element={<Navigate to="/studio" replace />} />
        <Route path="/designs/:id" element={<LegacyDesignRedirect />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/studio" replace />} />
      </Routes>
    </>
  );
}

export default App;
