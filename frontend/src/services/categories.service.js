import api from "./api";
import { singleFlight } from "../utils/singleFlight";
import {
  dataCacheGet,
  dataCacheSet,
  invalidateDataCacheKey,
} from "../utils/ttlCache";

const CATALOG_TTL = 60_000; // catálogo de categorías: casi inmóvil dentro de una sesión

export async function fetchCategories() {
  // Single-flight: StrictMode monta 2 veces el efecto de carga; ambas llamadas
  // (idénticas) comparten UNA request de red (FASE 1).
  //
  // FASE 2 · Navegación: /categories se pide en Historial Y en More (lo
  // midió fase2_before). Es un catálogo estable → se cachea en memoria con
  // TTL. La 2ª pantalla (More) ya NO pide la misma URL de nuevo: recibe el
  // dato en <1ms desde el caché. createCategory() invalida la clave para que
  // un alta nunca quede tapada por datos viejos.
  const cached = dataCacheGet("categories:list");
  if (cached !== undefined) return cached;

  return singleFlight("categories:load", async () => {
    const { data } = await api.get("/categories");
    dataCacheSet("categories:list", data, CATALOG_TTL);
    return data;
  });
}

export async function createCategory(name) {
  const { data } = await api.post("/categories", { name });
  // La lista recién creada queda desactualizada; forzamos que la próxima
  // lectura vaya a red (o reconstruya desde single-flight) con el alta visible.
  invalidateDataCacheKey("categories:list");
  return data;
}
