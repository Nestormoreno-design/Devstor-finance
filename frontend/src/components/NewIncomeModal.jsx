import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { createIncome } from "../services/income.service";
import { fetchPockets } from "../services/pockets.service";

const SUGGESTED_TYPES = ["Nominal", "Extra", "Bonificación", "Freelance", "Reembolso", "Otro"];

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export default function NewIncomeModal({ onClose, onCreated }) {
  const [pockets, setPockets] = useState([]);
  const [form, setForm] = useState({
    pocket_id: "",
    amount: "",
    type: "Nominal",
    description: "",
    date: todayISO(),
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPockets().then((data) => {
      setPockets(data);
      if (data.length > 0) setForm((f) => ({ ...f, pocket_id: data[0].id }));
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.pocket_id) {
      setError("Crea un bolsillo primero para poder registrar ingresos.");
      return;
    }
    setSubmitting(true);
    try {
      const income = await createIncome({ ...form, amount: Number(form.amount) });
      onCreated(income);
    } catch (err) {
      setError(err.response?.data?.detail || "No pudimos registrar el ingreso.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center">
      <div className="modal-panel">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl text-ink dark:text-paper">Nuevo ingreso</h2>
          <button onClick={onClose} className="text-ink/50 dark:text-paper/50">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            placeholder="Descripción (ej. Salario septiembre)"
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

          <select
            required
            className="input-field"
            value={form.pocket_id}
            onChange={(e) => setForm({ ...form, pocket_id: e.target.value })}
          >
            {pockets.length === 0 && <option value="">No tienes bolsillos aún</option>}
            {pockets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
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
            {submitting ? "Guardando…" : "Guardar ingreso"}
          </button>
        </form>
      </div>
    </div>
  );
}
