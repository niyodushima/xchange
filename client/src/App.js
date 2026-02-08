import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import "./App.css";

import BroadcastHost from "./components/BroadcastHost";
import BroadcastViewer from "./components/BroadcastViewer";
import VideoChat from "./components/VideoChat";
import SignUp from "./components/SignUp";
import Login from "./components/Login";

function Shell({ isAuthenticated, setIsAuthenticated }) {
  const location = useLocation();
  const navigate = useNavigate();

  const path = location.pathname;
  const current =
    path === "/learn" ? "learn" :
    path === "/teach" ? "teach" :
    path === "/profile" ? "profile" :
    "learn";

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
                Instant learning & teaching matchmaking
              </span>
            </div>
          </div>

          <div className="app-nav-right">
            <button
              className={`app-nav-button ${current === "learn" ? "active" : ""}`}
              onClick={() => navigate("/learn")}
            >
              <span className="icon">🎓</span>
              <span>Learn</span>
            </button>

            <button
              className={`app-nav-button ${current === "teach" ? "active" : ""}`}
              onClick={() => navigate("/teach")}
            >
              <span className="icon">🧑‍🏫</span>
              <span>Teach</span>
            </button>

            <button
              className={`app-nav-button ${current === "profile" ? "active" : ""}`}
              onClick={() => navigate("/profile")}
            >
              <span className="icon">💰</span>
              <span>Profile</span>
            </button>

            {isAuthenticated && (
              <button
                className="app-nav-button"
                onClick={() => setIsAuthenticated(false)}
              >
                <span className="icon">🚪</span>
                <span>Logout</span>
              </button>
            )}
          </div>
        </header>

        {/* ✅ MAIN CONTENT */}
        <main className="app-main-panel">
          {current === "learn" && <BroadcastViewer />}
          {current === "teach" && <BroadcastHost />}
          {current === "profile" && <VideoChat />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  const handleSignUp = (data) => {
    console.log("Sign up:", data);
    setIsAuthenticated(true);
  };

  const handleLogin = (data) => {
    console.log("Login:", data);
    setIsAuthenticated(true);
  };

  return (
    <Router>
      <Routes>
        {/* Default route → SignUp */}
        <Route path="/" element={<SignUp onSubmit={handleSignUp} />} />
        <Route path="/signup" element={<SignUp onSubmit={handleSignUp} />} />
        <Route path="/login" element={<Login onSubmit={handleLogin} />} />

        {/* Protected shell */}
        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <Shell isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
}
