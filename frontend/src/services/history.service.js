import api from "./api";
import { singleFlight } from "../utils/singleFlight";
import { dataCacheGet, dataCacheSet } from "../utils/ttlCache";

// TTL del historial POR FILTROS: ventana de SESIÓN (sin caducidad dentro de la
// sesión). FASE 2 · Precarga: en cuanto se confirma la autenticación (AuthGate)
// se dispara fetchHistory() en background y el listado queda en MEMORIA (este
// caché con TTL de sesión, NUNCA en localStorage/sessionStorage/IndexedDB).
// Cuando el usuario entra a Historial recibe los movimientos AL INSTANTE:
// la request de ~1s (medición ANTES) NO se vuelve a hacer. Las mutaciones
// (alta/edición/borrado de gasto, ingreso o transferencia) llaman a
// invalidateDataCacheKey("/history") -> el dato nunca queda viejo, nunca
// cache tras un alta.
const SESSION_TTL = Number.MAX_SAFE_INTEGER; // en memoria durante toda la sesión

export async function fetchHistory(filters = {}) {
  // Clave = URL completa (base + query), igual que dashboard/categories:
  // dos pantallas que piden el MISMO recurso con los MISMOS filtros comparten
  // dato; con filtros distintos usan claves distintas.
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") params.set(k, v);
  });
  const cacheKey = `/history?${params.toString()}`;

  const hit = dataCacheGet(cacheKey);
  if (hit !== undefined) return hit;

  return singleFlight(cacheKey, async () => {
    const { data } = await api.get("/history", { params: filters });
    dataCacheSet(cacheKey, data, SESSION_TTL);
    return data;
  });
}
