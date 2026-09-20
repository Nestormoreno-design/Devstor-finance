import api from "./api";
import { singleFlight } from "../utils/singleFlight";
import { dataCacheGet, dataCacheSet } from "../utils/ttlCache";

// TTL del dashboard POR PERIODO: ventana corta (~15s). Si el usuario vuelve a
// Dashboard dentro de esta ventana recibe el dato al instante (se EVITA una
// segunda request de red de ~933ms); pasado el TTL se vuelve a consultar de
// verdad, para que los datos nunca queden viejos. Las mutaciones que cambian
// saldos/gastos invalidan la clave (invalidateDataCacheKey) -> dato siempre
// fresco, nunca cache viejo tras un alta/ediciÃ³n/borrado.
const PERIOD_TTL = 15_000;


export async function fetchDashboard(period = "this_month", startDate, endDate) {
  const params = { period };
  if (period === "custom") {
    params.start_date = startDate;
    params.end_date = endDate;
  }

  // Clave = URL completa (base + query). Dos pantallas que piden el MISMO
  // recurso con los MISMOS filtros comparten cache; con filtros distintos
  // usan claves distintas (igual que single-flight).
  const cacheKey = `/dashboard?${new URLSearchParams(params).toString()}`;

  const hit = dataCacheGet(cacheKey);
  if (hit !== undefined) return hit;

  return singleFlight(cacheKey, async () => {
    const { data } = await api.get("/dashboard", { params });
    dataCacheSet(cacheKey, data, PERIOD_TTL);
    return data;
  });
}
