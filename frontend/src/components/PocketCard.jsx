import { useState } from "react";
import {
  Landmark,
  Smartphone,
  Wallet,
  PiggyBank,
  CircleDollarSign,
  MoreVertical,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react";
import { formatCurrency } from "../utils/formatCurrency";

const ICONS_BY_TYPE = {
  banco: Landmark,
  "billetera digital": Smartphone,
  efectivo: Wallet,
  ahorros: PiggyBank,
};

function iconFor(type) {
  return ICONS_BY_TYPE[type?.toLowerCase()] || CircleDollarSign;
}

export default function PocketCard({ pocket, onClick, onEdit, onDelete, onAddMoney }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const Icon = iconFor(pocket.type);
  const isNegative = parseFloat(pocket.balance) < 0;

  const hasActions = Boolean(onEdit || onDelete || onAddMoney);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className="card relative flex w-full items-center justify-between gap-4">
      <button
        type="button"
        onClick={onClick}
        className="flex min-w-0 flex-1 items-center gap-3 text-left transition-transform active:scale-[0.98]"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-chip bg-pine/10 text-pine dark:bg-pine/20 dark:text-pine-light">
          <Icon size={20} strokeWidth={1.8} />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-medium text-ink dark:text-paper">
            {pocket.name}
          </span>
          <span className="block text-xs text-ink/50 dark:text-paper/50">
            {pocket.type}
          </span>
        </span>
      </button>

      <div className="flex shrink-0 items-center gap-1">
        <p
          className={`font-display text-lg ${
            isNegative ? "text-brick" : "text-ink dark:text-paper"
          }`}
        >
          {formatCurrency(pocket.balance)}
        </p>

        {hasActions && (
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((open) => !open);
              }}
              className="rounded-full p-2 text-ink/40 transition-colors hover:bg-ink/5 hover:text-ink dark:text-paper/40 dark:hover:bg-paper/10 dark:hover:text-paper"
              aria-label={`Opciones de ${pocket.name}`}
            >
              <MoreVertical size={18} />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeMenu();
                  }}
                  aria-hidden="true"
                />
                <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-card border border-line bg-paper shadow-lg dark:border-line-dark dark:bg-ink">
                  {onAddMoney && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeMenu();
                        onAddMoney(pocket);
                      }}
                      className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-ink hover:bg-ink/5 dark:text-paper dark:hover:bg-paper/10"
                    >
                      <Plus size={16} className="text-pine" />
                      Agregar dinero
                    </button>
                  )}
                  {onEdit && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeMenu();
                        onEdit(pocket);
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
                      onClick={(e) => {
                        e.stopPropagation();
                        closeMenu();
                        onDelete(pocket);
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
  );
}