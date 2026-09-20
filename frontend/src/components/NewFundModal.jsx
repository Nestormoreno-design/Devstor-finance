import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { createFund } from "../services/funds.service";
import { fetchPockets } from "../services/pockets.service";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function NewFundModal({ onClose, onCreated }) {
  const [pockets, setPockets] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    assigned_amount: "",
    default_pocket_id: "",
    start_date: todayISO(),
    end_date: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPockets().then(setPockets);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const fund = await createFund({
        ...form,
        assigned_amount: Number(form.assigned_amount),
        default_pocket_id: form.default_pocket_id || null,
        end_date: form.end_date || null,
      });
      onCreated(fund);
    } catch (err) {
      setError(err.response?.data?.detail || "No pudimos crear el fondo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center">
      <div className="modal-panel">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl text-ink dark:text-paper">Nuevo fondo</h2>
          <button onClick={onClose} className="text-ink/50 dark:text-paper/50">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            required
            placeholder="Nombre (ej. Viáticos Santa Rosa)"
            className="input-field"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            type="number"
            step="0.01"
            required
            placeholder="Monto asignado"
            className="input-field"
            value={form.assigned_amount}
            onChange={(e) => setForm({ ...form, assigned_amount: e.target.value })}
          />
          <select
            className="input-field"
            value={form.default_pocket_id}
            onChange={(e) => setForm({ ...form, default_pocket_id: e.target.value })}
          >
            <option value="">Sin bolsillo sugerido</option>
            {pockets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            placeholder="Descripción (opcional)"
            className="input-field"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-ink/50 dark:text-paper/50">Fecha inicial</label>
              <input
                type="date"
                required
                className="input-field"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink/50 dark:text-paper/50">
                Fecha final (opcional)
              </label>
              <input
                type="date"
                className="input-field"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              />
            </div>
          </div>

          {error && <p className="text-sm text-brick">{error}</p>}

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Creando…" : "Crear fondo"}
          </button>
        </form>
      </div>
    </div>
  );
}
