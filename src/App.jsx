import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import BottomNav from "./components/BottomNav";
import Loading from "./components/Loading";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Home from "./pages/Home";
import Tasks from "./pages/Tasks";
import Statistics from "./pages/Statistics";
import Settings from "./pages/Settings";
import { useEffect } from "react";

import Toast from "./components/Toast";

export default function App() {
  const { user, loading } = useAuth();

  // Handle Android back button via Capacitor App plugin
  useEffect(() => {
    let cleanup;
    const initBackButton = async () => {
      try {
        const { App: CapApp } = await import("@capacitor/app");
        const listener = await CapApp.addListener("backButton", ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
          } else {
            CapApp.exitApp();
          }
        });
        cleanup = () => listener.remove();
      } catch {
        // Not running in Capacitor (web browser)
      }
    };
    initBackButton();
    return () => cleanup?.();
  }, []);

  if (loading) {
    return <Loading message="Loading..." />;
  }

  return (
    <div className="app-container">
      <div className="app-content">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <Tasks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/statistics"
            element={
              <ProtectedRoute>
                <Statistics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {user && <BottomNav />}
      <Toast />
    </div>
  );
}