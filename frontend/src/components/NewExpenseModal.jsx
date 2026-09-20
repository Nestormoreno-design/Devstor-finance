import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { createExpense } from "../services/expenses.service";
import { fetchPockets } from "../services/pockets.service";
import { fetchCategories } from "../services/categories.service";
import { fetchFunds } from "../services/funds.service";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function NewExpenseModal({ onClose, onCreated }) {
  const [pockets, setPockets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [funds, setFunds] = useState([]);
  const [form, setForm] = useState({
    amount: "",
    concept: "",
    category_id: "",
    pocket_id: "",
    fund_id: "",
    date: todayISO(),
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([fetchPockets(), fetchCategories(), fetchFunds()]).then(
      ([pocketsData, categoriesData, fundsData]) => {
        setPockets(pocketsData);
        setCategories(categoriesData);
        setFunds(fundsData.filter((f) => f.status === "active"));
        setForm((f) => ({
          ...f,
          pocket_id: pocketsData[0]?.id || "",
          category_id: categoriesData[0]?.id || "",
        }));
      }
    );
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.pocket_id || !form.category_id) {
      setError("Necesitas al menos un bolsillo y una categoría.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        fund_id: form.fund_id || null,
      };
      const expense = await createExpense(payload);
      onCreated(expense);
    } catch (err) {
      setError(err.response?.data?.detail || "No pudimos registrar el gasto.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center">
      <div className="modal-panel">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl text-ink dark:text-paper">Nuevo gasto</h2>
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
            required
            placeholder="Concepto (ej. Almuerzo)"
            className="input-field"
            value={form.concept}
            onChange={(e) => setForm({ ...form, concept: e.target.value })}
          />

          <select
            required
            className="input-field"
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
          >
            {categories.length === 0 && <option value="">Sin categorías</option>}
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
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

          {funds.length > 0 && (
            <select
              className="input-field"
              value={form.fund_id}
              onChange={(e) => setForm({ ...form, fund_id: e.target.value })}
            >
              <option value="">Sin fondo (gasto personal)</option>
              {funds.map((f) => (
                <option key={f.id} value={f.id}>
                  Fondo: {f.name}
                </option>
              ))}
            </select>
          )}

          <input
            type="date"
            required
            className="input-field"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />

          {error && <p className="text-sm text-brick">{error}</p>}

          <button type="submit" className="btn-primary !bg-brick hover:!bg-brick-light" disabled={submitting}>
            {submitting ? "Guardando…" : "Guardar gasto"}
          </button>
        </form>
      </div>
    </div>
  );
}
