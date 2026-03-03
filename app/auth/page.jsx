// app/auth/page.jsx
"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [error, setError] = useState("");
  const { login, register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (isLogin) {
        console.log("Attempting Login...");
        await login({ email, password });
      } else {
        console.log("Attempting Register...");
        const res = await register({ email, password, name, businessName });
        console.log("Registration Success, Token saved:", !!res.token);
      }
      console.log("Redirecting to dashboard...");
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || (isLogin ? "Login failed" : "Registration failed"));
    }
  };

  return (
    <div style={{
      display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center",
      background: "#0A0F1A", color: "#E2E8F0", fontFamily: "sans-serif", padding: "20px"
    }}>
      <div style={{
        background: "#111827", padding: "2rem", borderRadius: "12px",
        width: "100%", maxWidth: "400px", border: "1px solid #1E2D42"
      }}>
        <h1 style={{ marginBottom: "0.5rem", fontSize: "24px", textAlign: "center" }}>
          CareBot {isLogin ? "Login" : "Register"}
        </h1>
        <p style={{ textAlign: "center", color: "#94A3B8", fontSize: "14px", marginBottom: "1.5rem" }}>
          {isLogin ? "Ingia kuendelea na dashboard" : "Anza kutumia CareBot leo"}
        </p>
        
        {error && (
          <div style={{ background: "#EF444415", color: "#EF4444", padding: "10px", borderRadius: "6px", marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {!isLogin && (
            <>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "14px" }}>Jina Lako</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{
                    width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #1E2D42",
                    background: "#1A2235", color: "#fff", outline: "none"
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "14px" }}>Jina la Biashara</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                  style={{
                    width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #1E2D42",
                    background: "#1A2235", color: "#fff", outline: "none"
                  }}
                />
              </div>
            </>
          )}
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "14px" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #1E2D42",
                background: "#1A2235", color: "#fff", outline: "none"
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "14px" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #1E2D42",
                background: "#1A2235", color: "#fff", outline: "none"
              }}
            />
          </div>
          <button type="submit" style={{
            background: "#00D4AA", color: "#000", padding: "12px", borderRadius: "8px",
            border: "none", fontWeight: "bold", cursor: "pointer", marginTop: "1rem"
          }}>
            {isLogin ? "Ingia" : "Tengeneza Akaunti"}
          </button>
        </form>

        <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "14px" }}>
          <span style={{ color: "#94A3B8" }}>
            {isLogin ? "Huna akaunti bado? " : "Tayari unayo akaunti? "}
          </span>
          <button 
            onClick={() => setIsLogin(!isLogin)}
            style={{ background: "none", border: "none", color: "#00D4AA", cursor: "pointer", fontWeight: "bold" }}
          >
            {isLogin ? "Jisajili hapa" : "Ingia hapa"}
          </button>
        </div>
      </div>
    </div>
  );
}
