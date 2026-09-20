import api from "./api";
import { invalidateDataCacheKey } from "../utils/ttlCache";

export async function createTransfer(payload) {
  const { data } = await api.post("/transfers", payload);
  invalidateDataCacheKey("pockets");
  invalidateDataCacheKey("/dashboard");
  invalidateDataCacheKey("/history");
  return data;
}

export async function deleteTransfer(id) {
  await api.delete(`/transfers/${id}`);
  invalidateDataCacheKey("pockets");
  invalidateDataCacheKey("/dashboard");
  invalidateDataCacheKey("/history");
}
