// context/AuthContext.jsx
"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { api, clearToken, setToken } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);   // true while checking token

  // On mount — check if token exists and load user
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      api.auth.me()
        .then(({ user, business }) => {
          setUser(user);
          setBusiness(business);
          setSubscription({
            plan: business?.plan,
            messages_limit: business?.messages_limit,
            messages_used: business?.messages_used,
          });
        })
        .catch(() => clearToken())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async ({ email, password }) => {
    const data = await api.auth.login({ email, password });
    setToken(data.token);
    setUser(data.user);
    setBusiness(data.business);
    return data;
  };

  const register = async (body) => {
    const data = await api.auth.register(body);
    setToken(data.token);
    setUser(data.user);
    setBusiness(data.business);
    return data;
  };

  const logout = () => {
    clearToken();
    setUser(null);
    setBusiness(null);
    window.location.href = "/auth";
  };

  const refreshBusiness = async () => {
    try {
      const b = await api.business.get();
      setBusiness(b);
      setSubscription({
        plan: b.plan,
        messages_limit: b.messages_limit,
        messages_used: b.messages_used,
      });
    } catch {}
  };

  return (
    <AuthContext.Provider value={{
      user, business, subscription, loading,
      login, register, logout, refreshBusiness,
      isLoggedIn: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
