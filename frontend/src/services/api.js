import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("devstor_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.metadata = { startTime: performance.now() };
  const label = config.url?.includes("/pockets") ? "[POCKETS][API]" : config.url?.includes("/funds") ? "[FUNDS][API]" : "[API]";
  console.log(`${label} request start`, config.method?.toUpperCase(), config.url, performance.now());
  return config;
});

// Si el token expira o es inválido, cerramos sesión localmente
// para que el usuario no quede en un estado ambiguo.
api.interceptors.response.use(
  (response) => {
    const duration = performance.now() - (response.config?.metadata?.startTime || performance.now());
    const label = response.config?.url?.includes("/pockets") ? "[POCKETS][API]" : response.config?.url?.includes("/funds") ? "[FUNDS][API]" : "[API]";
    console.log(`${label} response`, response.config?.method?.toUpperCase(), response.config?.url, response.status, `${duration.toFixed(2)}ms`);
    return response;
  },
  (error) => {
    const duration = performance.now() - (error.config?.metadata?.startTime || performance.now());
    const label = error.config?.url?.includes("/pockets") ? "[POCKETS][API]" : error.config?.url?.includes("/funds") ? "[FUNDS][API]" : "[API]";
    console.error(`${label} error`, error.config?.method?.toUpperCase(), error.config?.url, error.response?.status || "NETWORK_ERROR", `${duration.toFixed(2)}ms`, error.message);
    if (error.response?.status === 401) {
      localStorage.removeItem("devstor_token");
    }
    return Promise.reject(error);
  }
);

export default api;
