import { useAuth } from "../context/AuthContext";
import AppLayout from "../layouts/AppLayout";

// Puerta de rendimiento SEGURA: el ProtectedRoute ya monta los hijos durante
// la validación de /auth/me (sus efectos disparan la carga de datos EN
// PARALELO). Este componente hace que la pantalla NO renderice absolutamente
// nada de contenido privado hasta que la sesión quede confirmada (`user`).
//
// Uso en pantallas protegidas, SIEMPRE DESPUÉS de todos los hooks:
//   const { user } = useAuth();
//   if (!user) return <AuthGate />;
//   return ( ...contenido con datos... );
//
// Así los efectos ya corrieron en paralelo y el contenido solo se muestra
// una vez confirmada la autenticación. No muestra NINGÚN dato privado antes.
export default function AuthGate() {
  const { user } = useAuth();
  if (!user) return nullTD; // placeholder
  return null;
}
