import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { formatCurrency } from "../utils/formatCurrency";
import { fetchPockets } from "../services/pockets.service";

export default function EditFundModal({ fund, onClose, onUpdated, updateFund }) {
  const [pockets, setPockets] = useState([]);
  const [form, setForm] = useState({
    name: fund.name ?? "",
    description: fund.description ?? "",
    assigned_amount: fund.assigned_amount ?? "",
    default_pocket_id: fund.default_pocket_id ?? "",
    end_date: fund.end_date ?? "",
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
      const updated = await updateFund(fund.id, {
        name: form.name.trim(),
        description: form.description.trim() || null,
        assigned_amount: Number(form.assigned_amount),
        default_pocket_id: form.default_pocket_id || null,
        end_date: form.end_date || null,
      });
      onUpdated(updated);
    } catch (err) {
      setError(err.response?.data?.detail || "No pudimos guardar los cambios del fondo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center">
      <div className="modal-panel">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl text-ink dark:text-paper">Editar fondo</h2>
          <button onClick={onClose} className="text-ink/50 dark:text-paper/50" aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <div className="mb-4 flex items-center justify-between rounded-card bg-ink/5 px-4 py-3 text-xs text-ink/70 dark:bg-paper/10 dark:text-paper/70">
          <span>
            Gastado: <strong className="text-ink dark:text-paper">{formatCurrency(fund.spent)}</strong>
          </span>
          <span>
            Disponible:{" "}
            <strong className={Number(fund.available) < 0 ? "text-brick" : "text-ink dark:text-paper"}>
              {formatCurrency(fund.available)}
            </strong>
          </span>
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

          {error && <p className="text-sm text-brick">{error}</p>}

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Guardando…" : "Guardar cambios"}
          </button>
        </form>
      </div>
    </div>
  );
}