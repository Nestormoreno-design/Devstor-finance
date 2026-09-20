import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { createTransfer } from "../services/transfers.service";
import { fetchPockets } from "../services/pockets.service";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function NewTransferModal({ onClose, onCreated }) {
  const [pockets, setPockets] = useState([]);
  const [form, setForm] = useState({
    from_pocket_id: "",
    to_pocket_id: "",
    amount: "",
    description: "",
    date: todayISO(),
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPockets().then((data) => {
      setPockets(data);
      setForm((f) => ({
        ...f,
        from_pocket_id: data[0]?.id || "",
        to_pocket_id: data[1]?.id || data[0]?.id || "",
      }));
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.from_pocket_id === form.to_pocket_id) {
      setError("El bolsillo de origen y destino no pueden ser el mismo.");
      return;
    }
    setSubmitting(true);
    try {
      const transfer = await createTransfer({ ...form, amount: Number(form.amount) });
      onCreated(transfer);
    } catch (err) {
      setError(err.response?.data?.detail || "No pudimos hacer la transferencia.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center">
      <div className="modal-panel">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl text-ink dark:text-paper">Transferir entre bolsillos</h2>
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

          <div>
            <label className="mb-1 block text-xs text-ink/50 dark:text-paper/50">Desde</label>
            <select
              required
              className="input-field"
              value={form.from_pocket_id}
              onChange={(e) => setForm({ ...form, from_pocket_id: e.target.value })}
            >
              {pockets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-ink/50 dark:text-paper/50">Hacia</label>
            <select
              required
              className="input-field"
              value={form.to_pocket_id}
              onChange={(e) => setForm({ ...form, to_pocket_id: e.target.value })}
            >
              {pockets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <input
            placeholder="Descripción (opcional)"
            className="input-field"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <input
            type="date"
            required
            className="input-field"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />

          {error && <p className="text-sm text-brick">{error}</p>}

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Transfiriendo…" : "Transferir"}
          </button>
        </form>
      </div>
    </div>
  );
}
