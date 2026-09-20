import { useState } from "react";
import { X } from "lucide-react";
import { createIncome } from "../services/income.service";

const SUGGESTED_TYPES = ["Nominal", "Extra", "Bonificación", "Freelance", "Reembolso", "Otro"];

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export default function AddMoneyModal({ pocket, onClose, onCreated }) {
  const [form, setForm] = useState({
    pocket_id: pocket.id,
    amount: "",
    type: "Nominal",
    description: "",
    date: todayISO(),
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const income = await createIncome({ ...form, amount: Number(form.amount) });
      onCreated(income);
    } catch (err) {
      setError(err.response?.data?.detail || "No pudimos agregar el dinero.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center">
      <div className="modal-panel">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl text-ink dark:text-paper">Agregar dinero</h2>
          <button onClick={onClose} className="text-ink/50 dark:text-paper/50" aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input required disabled className="input-field" value={pocket.name} aria-label="Bolsillo" />

          <input
            type="number"
            step="0.01"
            required
            autoFocus
            placeholder="Valor"
            className="input-field"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />

          <input
            placeholder="Descripción (opcional)"
            className="input-field"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <select
            className="input-field"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            {SUGGESTED_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <input
            type="date"
            required
            className="input-field"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />

          {error && <p className="text-sm text-brick">{error}</p>}

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Guardando…" : "Guardar"}
          </button>
        </form>
      </div>
    </div>
  );
}