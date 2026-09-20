import api from "./api";
import { invalidateDataCacheKey } from "../utils/ttlCache";

export async function createExpense(payload) {
  const { data } = await api.post("/expenses", payload);
  invalidateDataCacheKey("pockets");
  invalidateDataCacheKey("/dashboard");
  invalidateDataCacheKey("/history");
  if (payload.fund_id) invalidateDataCacheKey("funds");
  return data;
}

export async function updateExpense(id, payload) {
  const { data } = await api.put(`/expenses/${id}`, payload);
  invalidateDataCacheKey("pockets");
  invalidateDataCacheKey("/dashboard");
  invalidateDataCacheKey("/history");
  if (payload.fund_id) invalidateDataCacheKey("funds");
  return data;
}

export async function deleteExpense(id) {
  await api.delete(`/expenses/${id}`);
  invalidateDataCacheKey("pockets");
  invalidateDataCacheKey("/dashboard");
  invalidateDataCacheKey("/history");
  invalidateDataCacheKey("funds");
}
