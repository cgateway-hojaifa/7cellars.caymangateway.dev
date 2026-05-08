"use client";

import { useState } from "react";

export default function ProtectedPassword() {
  const protectedPasswordValue =
    process.env.NEXT_PUBLIC_PROTECTED_PASSWORD_VALUE;

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (password !== protectedPasswordValue) {
      setError("Incorrect password. Please try again.");
      return;
    }

    sessionStorage.setItem("password_verified", "true");

    window.dispatchEvent(new CustomEvent("passwordVerified"));
  };

  return (
    <div className="d-flex justify-content-center align-items-center access-form-area">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card password shadow-lg">
              <div className="card-body">
                <h3 className="card-title text-center mb-1">Access Required</h3>
                <p className="text-center text-muted mb-4">
                  Please enter the password to access the form.
                </p>
                <form onSubmit={handlePasswordSubmit}>
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">
                      Password
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    {error && <div className="text-danger mt-2">{error}</div>}
                  </div>
                  <button
                    type="submit"
                    className="complete-order access"
                    disabled={!password.trim()}
                  >
                    Access Form
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
