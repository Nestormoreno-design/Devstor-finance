import { useEffect, useMemo, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import AuthGate from "../components/AuthGate";
import MovementRow from "../components/MovementRow";
import NewIncomeModal from "../components/NewIncomeModal";
import NewExpenseModal from "../components/NewExpenseModal";
import { fetchHistory } from "../services/history.service";

const KIND_FILTERS = [
  { value: "", label: "Todos" },
  { value: "income", label: "Ingresos" },
  { value: "expense", label: "Gastos" },
  { value: "transfer", label: "Transferencias" },
];

function formatDayHeader(dateStr) {
  const date = new Date(dateStr + "T00:00:00");
  return date
    .toLocaleDateString("es-CO", { day: "2-digit", month: "short" })
    .toUpperCase()
    .replace(".", "");
}

export default function History() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState("");
  const [search, setSearch] = useState("");
  const [activeModal, setActiveModal] = useState(null); // "income" | "expense" | null
  const [searchTrigger, setSearchTrigger] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchHistory({ kind: kind || undefined, search: search || undefined })
      .then((data) => {
        if (!cancelled) setMovements(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [kind, searchTrigger]);

  const grouped = useMemo(() => {
    const groups = {};
    for (const m of movements) {
      if (!groups[m.date]) groups[m.date] = [];
      groups[m.date].push(m);
    }
    return Object.entries(groups).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [movements]);

  return (
    <AppLayout>
      <AuthGate>
      <h1 className="mb-6 font-display text-3xl text-ink dark:text-paper">Historial</h1>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setActiveModal("income")}
          className="btn-primary flex flex-1 items-center justify-center gap-2"
        >
          <ArrowUpCircle size={18} />
          Agregar ingreso
        </button>
        <button
          onClick={() => setActiveModal("expense")}
          className="flex flex-1 items-center justify-center gap-2 rounded-chip bg-brick px-4 py-3 text-sm font-medium text-paper hover:bg-brick-light"
        >
          <ArrowDownCircle size={18} />
          Agregar gasto
        </button>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto">
        {KIND_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setKind(f.value)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              kind === f.value
                ? "bg-pine text-paper"
                : "bg-ink/5 text-ink/60 dark:bg-paper/10 dark:text-paper/60"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSearchTrigger((t) => t + 1);
        }}
        className="mb-6"
      >
        <input
          placeholder="Buscar por concepto…"
          className="input-field"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </form>

      {loading && <p className="text-sm text-ink/50 dark:text-paper/50">Cargando…</p>}

      {!loading && movements.length === 0 && (
        <div className="card text-center">
          <p className="text-sm text-ink/60 dark:text-paper/60">
            Aún no tienes movimientos registrados.
          </p>
        </div>
      )}

      {grouped.map(([date, items]) => (
        <div key={date} className="mb-5">
          <p className="mb-1 text-xs font-medium text-ink/40 dark:text-paper/40">
            {formatDayHeader(date)}
          </p>
          <div className="card !py-1">
            {items.map((m) => (
              <MovementRow key={`${m.kind}-${m.id}`} movement={m} />
            ))}
          </div>
        </div>
      ))}

      {activeModal === "income" && (
        <NewIncomeModal
          onClose={() => setActiveModal(null)}
          onCreated={() => {
            setActiveModal(null);
          }}
        />
      )}
      {activeModal === "expense" && (
        <NewExpenseModal
          onClose={() => setActiveModal(null)}
          onCreated={() => {
            setActiveModal(null);
          }}
        />
      )}
      </AuthGate>
    </AppLayout>
  );
}
