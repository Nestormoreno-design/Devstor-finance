import api from "./api";
import { invalidateDataCacheKey } from "../utils/ttlCache";

export async function fetchIncome(pocketId) {
  const { data } = await api.get("/income", { params: pocketId ? { pocket_id: pocketId } : {} });
  return data;
}

export async function createIncome(payload) {
  const { data } = await api.post("/income", payload);
  invalidateDataCacheKey("pockets");
  invalidateDataCacheKey("/dashboard");
  invalidateDataCacheKey("/history");
  return data;
}

export async function updateIncome(id, payload) {
  const { data } = await api.put(`/income/${id}`, payload);
  invalidateDataCacheKey("pockets");
  invalidateDataCacheKey("/dashboard");
  invalidateDataCacheKey("/history");
  return data;
}

export async function deleteIncome(id) {
  await api.delete(`/income/${id}`);
  invalidateDataCacheKey("pockets");
  invalidateDataCacheKey("/dashboard");
  invalidateDataCacheKey("/history");
}
