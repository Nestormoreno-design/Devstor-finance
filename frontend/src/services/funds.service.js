import api from "./api";
import { singleFlight } from "../utils/singleFlight";
import {
  dataCacheGet,
  dataCacheSet,
  invalidateDataCacheKey,
} from "../utils/ttlCache";

// FASE 3 - bootstrap global: estos lists se leen 1 sola vez y quedan en memoria.
// Navegar a Fondos = lectura del caché (0 requests).
const FUNDS_TTL = 30_000;
const FUNDS_KEY = "funds:list";

export async function fetchFunds() {
  const hit = dataCacheGet(FUNDS_KEY);
  if (hit !== undefined) {
    console.log("[FUNDS][SERVICE] cache HIT", performance.now());
    return hit;
  }
  console.log("[FUNDS][SERVICE] cache MISS, request start", performance.now());
  return singleFlight(FUNDS_KEY, async () => {
    console.log("[FUNDS][SERVICE] singleFlight loader start", performance.now());
    const { data } = await api.get("/funds");
    console.log("[FUNDS][SERVICE] singleFlight loader end", performance.now());
    dataCacheSet(FUNDS_KEY, data, FUNDS_TTL);
    return data;
  });
}

export async function createFund(payload) {
  const { data } = await api.post("/funds", payload);
  invalidateDataCacheKey(FUNDS_KEY);
  invalidateDataCacheKey("/dashboard");
  return data;
}

export async function updateFund(id, payload) {
  const { data } = await api.put(`/funds/${id}`, payload);
  invalidateDataCacheKey(FUNDS_KEY);
  invalidateDataCacheKey("/dashboard");
  return data;
}

export async function closeFund(id) {
  const { data } = await api.post(`/funds/${id}/close`);
  invalidateDataCacheKey(FUNDS_KEY);
  invalidateDataCacheKey("/dashboard");
  return data;
}

export async function deleteFund(id) {
  await api.delete(`/funds/${id}`);
  invalidateDataCacheKey(FUNDS_KEY);
  invalidateDataCacheKey("/dashboard");
}