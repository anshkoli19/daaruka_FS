import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import client from "../api/client";

export default function Register() {
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await client.post("/auth/register", form);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed");
    }
  };

  return (
    <div className="auth-card">
      <h2>Create account</h2>
      <form onSubmit={submit}>
        <label>Full name</label>
        <input name="full_name" value={form.full_name} onChange={change} />
        <label>Email</label>
        <input type="email" name="email" value={form.email} onChange={change} required />
        <label>Password</label>
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={change}
          required
          minLength={6}
        />
        {error && <p className="error-text">{error}</p>}
        <button type="submit">Register</button>
      </form>
      <p>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
