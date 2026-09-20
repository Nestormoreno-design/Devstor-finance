import { createContext, useContext, useEffect, useState } from "react";
import {
  changePasswordRequest,
  fetchMe,
  loginRequest,
  registerRequest,
  updateMe,
} from "../services/auth.service";
import { invalidateDataCache } from "../utils/ttlCache";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("devstor_token");
    if (!token) {
      setLoading(false);
      return;
    }
    fetchMe()
      .then(setUser)
      .catch(() => localStorage.removeItem("devstor_token"))
      .finally(() => setLoading(false));
  }, []);

  async function login(credentials) {
    const data = await loginRequest(credentials);
    localStorage.setItem("devstor_token", data.access_token);
    setUser(data.user);
    return data.user;
  }

  async function register(payload) {
    const data = await registerRequest(payload);
    localStorage.setItem("devstor_token", data.access_token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem("devstor_token");
    invalidateDataCache();
    setUser(null);
  }

  async function updateProfile(payload) {
    const updated = await updateMe(payload);
    setUser(updated);
    return updated;
  }

  function changePassword(payload) {
    return changePasswordRequest(payload);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateProfile, changePassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
