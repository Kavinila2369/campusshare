import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const login = async () => {
    try {
      const res = await API.post("/auth/login", { email, password });
      if (!res.data?.token || !res.data?.user) {
        return alert("Login failed: invalid server response");
      }
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      API.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;

      if (res.data.user.role === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (error) {
      const message = error.response?.data?.msg || error.message || "Login failed";
      if (message === "Network Error") {
        alert("Server not reachable. Make sure backend is running on http://localhost:5000.");
      } else {
        alert(message);
      }
    }
  };

  return (
    <div className="center">
      <div className="glass">
        <h2 style={{ textAlign: "center" }}>CampusShare</h2>
        <p style={{ textAlign: "center", marginBottom: 24 }}>
          Secure student resource sharing for Kongu students
        </p>

        <input
          type="email"
          placeholder="Enter @kongu.edu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="btn blue" style={{ width: "100%", marginTop: 12 }} onClick={login}>
          Login
        </button>

        <p className="textLink" onClick={() => navigate("/register")}>New user? Register</p>
      </div>
    </div>
  );
}