import api from "./api";
import { singleFlight } from "../utils/singleFlight";

export async function registerRequest({ username, email, password, full_name }) {
  const { data } = await api.post("/auth/register", { username, email, password, full_name });
  return data;
}

export async function loginRequest({ username, password }) {
  const { data } = await api.post("/auth/login", { username, password });
  return data;
}

export async function fetchMe() {
  // Single-flight: StrictMode monta 2 veces el efecto de arranque de
  // AuthProvider; ambas llamadas a /auth/me comparten UNA request de red.
  return singleFlight("auth:me", async () => {
    const { data } = await api.get("/auth/me");
    return data;
  });
}

export async function updateMe(payload) {
  const { data } = await api.put("/auth/me", payload);
  return data;
}

export async function changePasswordRequest(payload) {
  await api.put("/auth/me/password", payload);
}

export async function forgotPasswordRequest(email) {
  const { data } = await api.post("/auth/forgot-password", { email });
  return data;
}

export async function resetPasswordRequest(token, new_password) {
  const { data } = await api.post("/auth/reset-password", { token, new_password });
  return data;
}
