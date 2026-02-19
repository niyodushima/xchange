import React from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import "./App.css";

import VideoChat from "./components/VideoChat";
import SignUp from "./components/SignUp";
import Login from "./components/Login";

/* ✅ ProtectedRoute helper */
function ProtectedRoute({ isAuthenticated, children }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function Shell({ isAuthenticated, setIsAuthenticated }) {
  const navigate = useNavigate();

  return (
    <div className="app-root">
      <div className="app-shell">
        {/* ✅ NAVBAR */}
        <header className="app-nav">
          <div className="app-nav-left">
            <div className="app-title-block">
              <div className="app-title-row">
                <img
                  src="/xchange (1).png"
                  alt="Xchange Logo"
                  className="app-title-logo"
                />
                <span className="app-title">Xchange</span>
              </div>
              <span className="app-subtitle">
                Live video chat for instant skill exchange
              </span>
            </div>
          </div>

          <div className="app-nav-right">
            <button
              className="app-nav-button"
              onClick={() => navigate("/dashboard")}
            >
              <span className="icon">💬</span>
              <span>Dashboard</span>
            </button>

            {isAuthenticated && (
              <button
                className="app-nav-button"
                onClick={() => {
                  setIsAuthenticated(false);
                  localStorage.removeItem("auth");
                  navigate("/login");
                }}
              >
                <span className="icon">🚪</span>
                <span>Logout</span>
              </button>
            )}
          </div>
        </header>

        {/* ✅ MAIN CONTENT */}
        <main className="app-main-panel">
          <VideoChat />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(
    () => localStorage.getItem("auth") === "true"
  );

  const handleSignUp = (data) => {
    console.log("Sign up:", data);
    setIsAuthenticated(true);
    localStorage.setItem("auth", "true");
    window.location.href = "/login"; // redirect to login after signup
  };

  const handleLogin = (data) => {
    console.log("Login:", data);
    setIsAuthenticated(true);
    localStorage.setItem("auth", "true");
    window.location.href = "/dashboard"; // redirect to dashboard after login
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<SignUp onSubmit={handleSignUp} />} />
      <Route path="/signup" element={<SignUp onSubmit={handleSignUp} />} />
      <Route path="/login" element={<Login onSubmit={handleLogin} />} />

      {/* Protected shell */}
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Shell
              isAuthenticated={isAuthenticated}
              setIsAuthenticated={setIsAuthenticated}
            />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
