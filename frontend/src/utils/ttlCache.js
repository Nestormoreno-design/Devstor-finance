// Caché en memoria con TTL (time-to-live) para lecturas idempotentes (GET).
//
// FASE 2 · Navegación: tras la medición ANTES detectamos que /categories se
// pide en Historial Y en More, y /dashboard al volver a la pantalla Dashboard
// (MORE DE UNA request de red para la MISMA URL). Este caché evita repetir la
// request dentro de un TTL corto — sin React Query, sin tocar backend, sin
// ocultar loaders.
//
// Reglas:
// - Solo datos idempotentes de lectura. Las mutaciones que cambien el dato
//   deben llamar a invalidateDataCache() (o invalidateDataCacheKey(url)).
// - TTL corto (por defecto 15s para datos con period, 60s para catǭlogo): si
//   el usuario vuelve a la pantalla dentro del TTL recibe el dato instantǭneo;
//   pasado el TTL se vuelve a consultar de verdad (datos siempre frescos).
// - La clave ES la URL completa (base + query), igual que en single-flight:
//   dos pantallas que piden el mismo recurso con los mismos filtros comparten
//   cache; con filtros distintos usan claves distintas.
const store = new Map();

const DEFAULTS = {
  catalog: 60_000, // categor��as: catǭlogo casi inmóvil
  period: 15_000,  // dashboard/history por periodo: ventana corta
};

export function dataCacheGet(key) {
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) {
    return hit.value;
  }
  if (hit) store.delete(key); // expirado: limpiar
  return undefined;
}

export function dataCacheSet(key, value, ttl) {
  store.set(key, { value, expires: Date.now() + (ttl ?? DEFAULTS.period) });
}

// Invalidar TODO el caché (tras una mutación que puede afectar a muchos
// recursos: gasto, ingreso, transferencia, bolsillo, fondo).
export function invalidateDataCache() {
  store.clear();
}

// Invalidar una clave concreta (o varias por prefijo de URL).
export function invalidateDataCacheKey(keyOrPrefix) {
  for (const k of store.keys()) {
    if (k === keyOrPrefix || k.startsWith(keyOrPrefix)) store.delete(k);
  }
}
