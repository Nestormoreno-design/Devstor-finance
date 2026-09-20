import { useState } from "react";
import { Plus, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, X } from "lucide-react";
import NewIncomeModal from "./NewIncomeModal";
import NewExpenseModal from "./NewExpenseModal";
import NewTransferModal from "./NewTransferModal";

export default function FabMenu() {
  const [open, setOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // "income" | "expense" | "transfer" | null

  function handleCreated() {
    setActiveModal(null);
  }

  return (
    <>
      {open && (
        <button
          className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-[1px]"
          onClick={() => setOpen(false)}
          aria-label="Cerrar menú"
        />
      )}

      <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-3">
        {open && (
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={() => {
                setOpen(false);
                setActiveModal("income");
              }}
              className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-ink shadow-md dark:bg-ink dark:text-paper"
            >
              Ingreso
              <ArrowUpCircle size={18} className="text-pine" />
            </button>
            <button
              onClick={() => {
                setOpen(false);
                setActiveModal("expense");
              }}
              className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-ink shadow-md dark:bg-ink dark:text-paper"
            >
              Gasto
              <ArrowDownCircle size={18} className="text-brick" />
            </button>
            <button
              onClick={() => {
                setOpen(false);
                setActiveModal("transfer");
              }}
              className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-ink shadow-md dark:bg-ink dark:text-paper"
            >
              Transferencia
              <ArrowLeftRight size={18} className="text-gold" />
            </button>
          </div>
        )}

        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-pine text-paper shadow-lg transition-transform active:scale-95"
          aria-label="Agregar movimiento"
        >
          {open ? <X size={24} /> : <Plus size={24} />}
        </button>
      </div>

      {activeModal === "income" && (
        <NewIncomeModal onClose={() => setActiveModal(null)} onCreated={handleCreated} />
      )}
      {activeModal === "expense" && (
        <NewExpenseModal onClose={() => setActiveModal(null)} onCreated={handleCreated} />
      )}
      {activeModal === "transfer" && (
        <NewTransferModal onClose={() => setActiveModal(null)} onCreated={handleCreated} />
      )}
    </>
  );
}
