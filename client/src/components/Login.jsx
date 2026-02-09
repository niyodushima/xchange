import React, { useState } from "react";
import "./Login.css";

export default function Login({ onSubmit }) {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Both fields are required.");
      return;
    }

    onSubmit?.(formData);
  };

  return (
    <div className="auth-container">
      <h2>Log In</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
        />

        {error && <div className="error">{error}</div>}

        <button type="submit" className="primary">Log In</button>
      </form>
      <p className="auth-link">
        Don’t have an account? <a href="/signup">Sign up</a>
      </p>
    </div>
  );
}
