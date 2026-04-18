import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");

  const navigate = useNavigate();

  const register = async () => {
    try {
      const response = await API.post("/auth/register", { name, email, password, department });
      alert(response.data.msg || "Registered Successfully");
      navigate("/");
    } catch (error) {
      alert(error.response?.data?.msg || "Registration Failed");
    }
  };

  return (
    <div className="center">
      <div className="glass">
        <h2 style={{ textAlign: "center" }}>Register</h2>
        <p style={{ textAlign: "center", marginBottom: 24 }}>Create your CampusShare account</p>

        <input value={name} placeholder="Name" onChange={(e) => setName(e.target.value)} />
        <input value={email} placeholder="@kongu.edu email" onChange={(e) => setEmail(e.target.value)} />
        <input value={department} placeholder="Department" onChange={(e) => setDepartment(e.target.value)} />
        <input type="password" value={password} placeholder="Password" onChange={(e) => setPassword(e.target.value)} />

        <button className="btn blue" style={{ width: "100%", marginTop: 12 }} onClick={register}>
          Register
        </button>

        <p className="textLink" onClick={() => navigate("/")}>Already have an account? Login</p>
      </div>
    </div>
  );
}