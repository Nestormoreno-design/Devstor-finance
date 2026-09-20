import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { formatCurrency } from "../utils/formatCurrency";

export default function FundCard({ fund, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pct = Math.min(fund.utilization_pct, 100);
  const isOverBudget = fund.utilization_pct > 100;
  const hasActions = Boolean(onEdit || onDelete);

  return (
    <div className="card relative">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="font-medium text-ink dark:text-paper">{fund.name}</p>
          {fund.description && (
            <p className="text-xs text-ink/50 dark:text-paper/50">{fund.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {fund.status !== "active" && (
            <span className="rounded-chip bg-ink/10 px-2 py-0.5 text-[10px] uppercase text-ink/50 dark:bg-paper/10 dark:text-paper/50">
              {fund.status === "closed" ? "Cerrado" : "Inactivo"}
            </span>
          )}
          {hasActions && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="rounded-full p-2 text-ink/40 transition-colors hover:bg-ink/5 hover:text-ink dark:text-paper/40 dark:hover:bg-paper/10 dark:hover:text-paper"
                aria-label={`Opciones de ${fund.name}`}
              >
                <span className="text-lg leading-none">⋮</span>
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-card border border-line bg-paper shadow-lg dark:border-line-dark dark:bg-ink">
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onEdit(fund);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-ink hover:bg-ink/5 dark:text-paper dark:hover:bg-paper/10"
                      >
                        <Pencil size={16} className="text-pine" />
                        Editar
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onDelete(fund);
                        }}
                        className="flex w-full items-center gap-2 border-t border-line px-4 py-3 text-left text-sm font-medium text-brick hover:bg-ink/5 dark:border-line-dark dark:hover:bg-paper/10"
                      >
                        <Trash2 size={16} />
                        Eliminar
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-ink/10 dark:bg-paper/10">
        <div
          className={`h-full rounded-full ${isOverBudget ? "bg-brick" : "bg-pine"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-ink/60 dark:text-paper/60">
        <span>
          Gastado: <strong className="text-ink dark:text-paper">{formatCurrency(fund.spent)}</strong>
        </span>
        <span>{fund.utilization_pct.toFixed(0)}% utilizado</span>
      </div>

      <div className="mt-1 flex items-center justify-between text-xs text-ink/60 dark:text-paper/60">
        <span>Asignado: {formatCurrency(fund.assigned_amount)}</span>
        <span className={isOverBudget ? "text-brick" : ""}>
          Disponible: {formatCurrency(fund.available)}
        </span>
      </div>
    </div>
  );
}
