import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import SignUp from "./components/SignUp";
import Login from "./components/Login";
import BroadcastViewer from "./components/BroadcastViewer";
import BroadcastHost from "./components/BroadcastHost";

function App() {
  // For demo purposes, we’ll just use a fake auth flag.
  // Replace with your real auth logic (e.g., JWT, Firebase, etc.)
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

        {/* Protected routes */}
        <Route
          path="/viewer"
          element={isAuthenticated ? <BroadcastViewer /> : <Navigate to="/login" />}
        />
        <Route
          path="/host"
          element={isAuthenticated ? <BroadcastHost /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
}

export default App;
