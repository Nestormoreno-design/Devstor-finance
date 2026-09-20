import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // Redirige SOLO cuando la validación terminó y el usuario no está autenticado.
  // Mientras `loading` (validando /auth/me) los hijos ya están montados: sus
  // efectos arrancan la carga de datos EN PARALELO con la validación. Los
  // datos NO se muestran hasta que `user` se confirma (ver AuthGate).
  if (!loading && !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
