import api from "./api";
import { singleFlight } from "../utils/singleFlight";
import { dataCacheGet, dataCacheSet, invalidateDataCacheKey } from "../utils/ttlCache";

const POCKETS_TTL = 30_000;

export async function fetchPockets() {
  const cacheKey = "pockets:list";
  const hit = dataCacheGet(cacheKey);
  if (hit !== undefined) {
    console.log("[POCKETS][SERVICE] cache HIT", performance.now());
    return hit;
  }
  console.log("[POCKETS][SERVICE] cache MISS, request start", performance.now());
  return singleFlight(cacheKey, async () => {
    console.log("[POCKETS][SERVICE] singleFlight loader start", performance.now());
    const { data } = await api.get("/pockets");
    console.log("[POCKETS][SERVICE] singleFlight loader end", performance.now());
    dataCacheSet(cacheKey, data, POCKETS_TTL);
    return data;
  });
}

export async function fetchTotalBalance() {
  const { data } = await api.get("/pockets/total");
  return data.total;
}

export async function createPocket(payload) {
  const { data } = await api.post("/pockets", payload);
  invalidateDataCacheKey("pockets");
  invalidateDataCacheKey("/dashboard");
  return data;
}

export async function updatePocket(id, payload) {
  const { data } = await api.put(`/pockets/${id}`, payload);
  invalidateDataCacheKey("pockets");
  invalidateDataCacheKey("/dashboard");
  return data;
}

export async function deletePocket(id) {
  await api.delete(`/pockets/${id}`);
  invalidateDataCacheKey("pockets");
  invalidateDataCacheKey("/dashboard");
}