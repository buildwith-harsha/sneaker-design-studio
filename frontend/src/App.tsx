import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppHeader from "./components/AppHeader";
import DesignEditor from "./components/DesignEditor";
import MyDesigns from "./components/MyDesigns";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAppDispatch } from "./store/hooks";
import { checkAuth, logout } from "./store/authSlice";

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

        {/* Protected Studio & Design Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Navigate to="/designs/new" replace />
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
        <Route
          path="/designs/new"
          element={
            <ProtectedRoute>
              <DesignEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/designs/:id"
          element={
            <ProtectedRoute>
              <DesignEditor />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
