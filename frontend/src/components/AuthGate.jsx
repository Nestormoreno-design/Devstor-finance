import { useAuth } from "../context/AuthContext";

// Puerta de contenido SEGURA: unifica validación de auth con la premisa de
// rendimiento (cargar datos en paralelo) SIN violar "no mostrar datos privados
// antes de confirmar la autenticación".
//
// La pantalla protegida ya montó sus efectos y lanzó sus requests de datos EN
// PARALELO con /auth/me (ver ProtectedRoute). Este componente solo decide qué
// se RENDERIZA: hasta que `user` quede confirmado muestra un bloque neutro
// (sin NINGÚN dato privado). Justo después aparece el contenido — que ya venía
// cargándose en paralelo, así que no hay espera adicicional.
//
// Uso dentro de la pantalla (envuelve SOLO el contenido privado):
//   <AppLayout>
//     <AuthGate>{/* tarjetas, saldos, movimientos… */}</AuthGate>
//   </AppLayout>
export default function AuthGate({ children }) {
  const { user } = useAuth();

  if (!user) {
    return (
      <div
        className="card text-center"
        aria-label="Verificando sesión"
        role="status"
      >
        <p className="text-sm text-ink/60 dark:text-paper/60">Cargando…</p>
      </div>
    );
  }

  return children;
}
