import { useState } from "react";
import { X } from "lucide-react";
import CustomSelect from "./CustomSelect";

const SUGGESTED_TYPES = ["Banco", "Billetera digital", "Efectivo", "Ahorros", "Otro"];

const TYPE_OPTIONS = [
  ...SUGGESTED_TYPES.map((t) => ({ value: t, label: t })),
  { value: "__custom__", label: "Otro tipo (personalizado)" },
];

export default function NewPocketModal({ onClose, onCreated, createPocket }) {
  const [form, setForm] = useState({
    name: "",
    type: "Banco",
    initial_balance: "",
    description: "",
  });
  const [customType, setCustomType] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const pocket = await createPocket({
        ...form,
        initial_balance: form.initial_balance === "" ? 0 : Number(form.initial_balance),
      });
      onCreated(pocket);
    } catch (err) {
      setError(err.response?.data?.detail || "No pudimos crear el bolsillo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center">
      <div className="modal-panel">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl text-ink dark:text-paper">Nuevo bolsillo</h2>
          <button onClick={onClose} className="text-ink/50 dark:text-paper/50">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            required
            placeholder="Nombre (ej. Bancolombia)"
            className="input-field"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          {customType ? (
            <input
              required
              autoFocus
              placeholder="Escribe el tipo"
              className="input-field"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            />
          ) : (
            <CustomSelect
              ariaLabel="Tipo de bolsillo"
              value={form.type}
              onChange={(value) => {
                if (value === "__custom__") {
                  setCustomType(true);
                  setForm({ ...form, type: "" });
                } else {
                  setForm({ ...form, type: value });
                }
              }}
              options={TYPE_OPTIONS}
            />
          )}

          <input
            type="number"
            step="0.01"
            placeholder="Saldo inicial"
            className="input-field"
            value={form.initial_balance}
            onChange={(e) => setForm({ ...form, initial_balance: e.target.value })}
          />

          <input
            placeholder="Descripción (opcional)"
            className="input-field"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          {error && <p className="text-sm text-brick">{error}</p>}

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Creando…" : "Crear bolsillo"}
          </button>
        </form>
      </div>
    </div>
  );
}
