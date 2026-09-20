import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import { createPocket } from "../services/pockets.service";

const SUGGESTIONS = [
  { name: "Efectivo", type: "Efectivo" },
  { name: "Cuenta de banco", type: "Banco" },
  { name: "Nequi", type: "Billetera digital" },
  { name: "Ahorros", type: "Ahorros" },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(new Set());
  const [customName, setCustomName] = useState("");
  const [customPockets, setCustomPockets] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  function toggle(name) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  function addCustom() {
    if (!customName.trim()) return;
    setCustomPockets((prev) => [...prev, customName.trim()]);
    setSelected((prev) => new Set(prev).add(customName.trim()));
    setCustomName("");
  }

  async function handleContinue() {
    setSubmitting(true);
    try {
      const allOptions = [...SUGGESTIONS, ...customPockets.map((name) => ({ name, type: "Otro" }))];
      const toCreate = allOptions.filter((o) => selected.has(o.name));
      await Promise.all(
        toCreate.map((o) => createPocket({ name: o.name, type: o.type, initial_balance: 0 }))
      );
      navigate("/", { replace: true });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout eyebrow="Un último paso" title="Configura tus bolsillos">
      <p className="mb-6 text-sm text-ink/60 dark:text-paper/60">
        Elige dónde tienes tu dinero. Puedes ajustar los saldos después.
      </p>

      <div className="mb-4 space-y-2">
        {SUGGESTIONS.map((s) => (
          <label
            key={s.name}
            className="flex cursor-pointer items-center gap-3 rounded-chip border border-line px-4 py-3 dark:border-line-dark"
          >
            <input
              type="checkbox"
              checked={selected.has(s.name)}
              onChange={() => toggle(s.name)}
              className="h-4 w-4 accent-pine"
            />
            <span className="text-ink dark:text-paper">{s.name}</span>
          </label>
        ))}
        {customPockets.map((name) => (
          <label
            key={name}
            className="flex cursor-pointer items-center gap-3 rounded-chip border border-line px-4 py-3 dark:border-line-dark"
          >
            <input
              type="checkbox"
              checked={selected.has(name)}
              onChange={() => toggle(name)}
              className="h-4 w-4 accent-pine"
            />
            <span className="text-ink dark:text-paper">{name}</span>
          </label>
        ))}
      </div>

      <div className="mb-6 flex gap-2">
        <input
          placeholder="Otro bolsillo personalizado"
          className="input-field"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
        />
        <button
          type="button"
          onClick={addCustom}
          className="shrink-0 rounded-chip bg-ink/5 px-4 text-sm font-medium text-ink dark:bg-paper/10 dark:text-paper"
        >
          Agregar
        </button>
      </div>

      <button onClick={handleContinue} className="btn-primary" disabled={submitting}>
        {submitting ? "Configurando…" : selected.size === 0 ? "Omitir por ahora" : "Continuar"}
      </button>
    </AuthLayout>
  );
}
