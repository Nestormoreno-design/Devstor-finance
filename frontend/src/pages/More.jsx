import { useEffect, useState } from "react";
import { Moon, Sun, LogOut, Plus, Check, Pencil, KeyRound } from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import AuthGate from "../components/AuthGate";
import PasswordInput from "../components/PasswordInput";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { createCategory, fetchCategories } from "../services/categories.service";

export default function More() {
  const { user, logout, updateProfile, changePassword } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [error, setError] = useState("");

  const [showProfile, setShowProfile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: "",
    email: "",
    full_name: "",
  });
  const [profileMsg, setProfileMsg] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm: "",
  });
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

  useEffect(() => {
    if (user) {
      setProfileForm({
        username: user.username ?? "",
        email: user.email ?? "",
        full_name: user.full_name ?? "",
      });
    }
  }, [user]);

  async function handleAddCategory(e) {
    e.preventDefault();
    if (!newCategory.trim()) return;
    setError("");
    try {
      const category = await createCategory(newCategory.trim());
      setCategories((prev) => [...prev, category]);
      setNewCategory("");
    } catch (err) {
      setError(err.response?.data?.detail || "No pudimos crear la categoría.");
    }
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setProfileError("");
    setProfileMsg("");
    if (!profileForm.username.trim()) {
      setProfileError("El nombre de usuario no puede estar vacío.");
      return;
    }
    setProfileSaving(true);
    try {
      await updateProfile({
        username: profileForm.username.trim(),
        email: profileForm.email.trim(),
        full_name: profileForm.full_name.trim() || null,
      });
      setProfileMsg("Perfil actualizado.");
    } catch (err) {
      setProfileError(err.response?.data?.detail || "No pudimos actualizar tu perfil.");
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPasswordError("");
    setPasswordMsg("");
    if (passwordForm.new_password.length < 8) {
      setPasswordError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm) {
      setPasswordError("Las contraseñas no coinciden.");
      return;
    }
    setPasswordSaving(true);
    try {
      await changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordMsg("Contraseña actualizada.");
      setPasswordForm({ current_password: "", new_password: "", confirm: "" });
    } catch (err) {
      setPasswordError(err.response?.data?.detail || "No pudimos cambiar la contraseña.");
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <AppLayout>
      <AuthGate>
      <h1 className="mb-6 font-display text-3xl text-ink dark:text-paper">Más</h1>

      <div className="card mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-ink/50 dark:text-paper/50">Cuenta</p>
            <p className="font-medium text-ink dark:text-paper">
              {user?.username || user?.full_name || "—"}
            </p>
            <p className="text-sm text-ink/60 dark:text-paper/60">{user?.email}</p>
          </div>
          <button
            onClick={() => {
              setShowProfile((v) => !v);
              setShowPassword(false);
            }}
            className="flex items-center gap-1.5 rounded-chip border border-line px-3 py-2 text-xs font-medium text-ink dark:border-line-dark dark:text-paper"
          >
            <Pencil size={14} />
            Editar perfil
          </button>
        </div>
      </div>

      {showProfile && (
        <form onSubmit={handleSaveProfile} className="card mb-4 space-y-3">
          <p className="font-medium text-ink dark:text-paper">Editar perfil</p>
          <input
            required
            minLength={3}
            placeholder="Usuario"
            className="input-field"
            value={profileForm.username}
            onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
          />
          <input
            required
            type="email"
            placeholder="Correo"
            className="input-field"
            value={profileForm.email}
            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
          />
          <input
            placeholder="Nombre completo (opcional)"
            className="input-field"
            value={profileForm.full_name}
            onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
          />

          {profileError && <p className="text-sm text-brick">{profileError}</p>}
          {profileMsg && (
            <p className="flex items-center gap-1 text-sm text-pine">
              <Check size={16} />
              {profileMsg}
            </p>
          )}

          <button type="submit" className="btn-primary" disabled={profileSaving}>
            {profileSaving ? "Guardando…" : "Guardar cambios"}
          </button>
        </form>
      )}

      <div className="card mb-4">
        <p className="mb-3 font-medium text-ink dark:text-paper">Contraseña</p>
        <button
          onClick={() => {
            setShowPassword((v) => !v);
            setShowProfile(false);
          }}
          className="flex items-center gap-2 text-sm font-medium text-pine"
        >
          <KeyRound size={16} />
          {showPassword ? "Ocultar" : "Cambiar contraseña"}
        </button>

        {showPassword && (
          <form onSubmit={handleChangePassword} className="mt-4 space-y-3">
            <PasswordInput
              required
              autoComplete="current-password"
              placeholder="Contraseña actual"
              value={passwordForm.current_password}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, current_password: e.target.value })
              }
            />
            <PasswordInput
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Nueva contraseña (mínimo 8 caracteres)"
              value={passwordForm.new_password}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, new_password: e.target.value })
              }
            />
            <PasswordInput
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Confirmar nueva contraseña"
              value={passwordForm.confirm}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
            />

            {passwordError && <p className="text-sm text-brick">{passwordError}</p>}
            {passwordMsg && (
              <p className="flex items-center gap-1 text-sm text-pine">
                <Check size={16} />
                {passwordMsg}
              </p>
            )}

            <button type="submit" className="btn-primary" disabled={passwordSaving}>
              {passwordSaving ? "Guardando…" : "Cambiar contraseña"}
            </button>
          </form>
        )}
      </div>

      <button
        onClick={toggleTheme}
        className="card mb-4 flex w-full items-center justify-between text-left"
      >
        <span className="font-medium text-ink dark:text-paper">Modo oscuro</span>
        {theme === "dark" ? <Moon size={20} className="text-pine" /> : <Sun size={20} className="text-gold" />}
      </button>

      <div className="card mb-4">
        <p className="mb-3 font-medium text-ink dark:text-paper">Mis categorías</p>
        <div className="mb-3 flex flex-wrap gap-2">
          {categories.map((c) => (
            <span
              key={c.id}
              className="rounded-chip bg-ink/5 px-2.5 py-1 text-xs text-ink/70 dark:bg-paper/10 dark:text-paper/70"
            >
              {c.name}
            </span>
          ))}
        </div>
        <form onSubmit={handleAddCategory} className="flex gap-2">
          <input
            placeholder="Nueva categoría"
            className="input-field"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <button type="submit" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-chip bg-pine text-paper">
            <Plus size={18} />
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-brick">{error}</p>}
      </div>

      <button onClick={logout} className="btn-primary !bg-brick hover:!bg-brick-light flex items-center justify-center gap-2">
        <LogOut size={18} />
        Cerrar sesión
      </button>
      </AuthGate>
    </AppLayout>
  );
}