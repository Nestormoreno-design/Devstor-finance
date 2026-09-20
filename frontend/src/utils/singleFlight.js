// Deduplicación en vuelo (single-flight) de GETs idempotentes.
//
// React StrictMode (que mantenemos, tal como se pidió) monta–desmonta–remonta
// los componentes en desarrollo, disparando cada efecto de carga DOS veces.
// En lugar de quitarlo o de "esconder" el problema, coalescemos aquí las
// peticiones idénticas en curso: la primera invocación crea la promesa y el
// resto DEVUELVE la misma promesa en vez de disparar otra request. Cuando la
// promesa termina se limpia la entrada, así un refresco posterior (otra
// versión de datos) vuelve a consultar de verdad.
//
// Reglas:
// - Solo aplica a lecturas idempotentes (GET). Las mutaciones (POST/PUT/DELETE)
//   NUNCA pasan por aquí.
// - La "clave" debe incluir TODO lo que cambie el resultado (periodo,
//   busqueda, filtros). Si algún día una pantalla pide lo mismo con distintos
//   filtros, usa claves distintas.
const inflight = new Map();

export function singleFlight(key, loader) {
  const existing = inflight.get(key);
  if (existing) return existing;
  const promise = loader().finally(() => {
    if (inflight.get(key) === promise) inflight.delete(key);
  });
  inflight.set(key, promise);
  return promise;
}
