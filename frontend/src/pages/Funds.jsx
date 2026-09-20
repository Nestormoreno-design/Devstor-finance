import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import AuthGate from "../components/AuthGate";
import FundCard from "../components/FundCard";
import NewFundModal from "../components/NewFundModal";
import EditFundModal from "../components/EditFundModal";
import { deleteFund, fetchFunds, updateFund } from "../services/funds.service";
import { formatCurrency } from "../utils/formatCurrency";

export default function Funds() {
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    let cancelled = false;
    console.log("[FUNDS][PAGE] load start", performance.now());
    setLoading(true);
    fetchFunds()
      .then((data) => {
        if (!cancelled) {
          console.log("[FUNDS][PAGE] load end", performance.now());
          setFunds(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("[FUNDS][PAGE] load error", err, performance.now());
        }
      })
      .finally(() => {
        if (!cancelled) {
          console.log("[FUNDS][PAGE] load end (finally)", performance.now());
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function confirmDelete() {
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteFund(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err.response?.data?.detail || "No pudimos eliminar el fondo.");
    } finally {
      setDeleting(false);
    }
  }

  const hasSpent = deleteTarget && Number(deleteTarget.spent) > 0;

  return (
    <AppLayout>
      <AuthGate>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl text-ink dark:text-paper">Fondos</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-pine text-paper shadow-sm"
          aria-label="Nuevo fondo"
        >
          <Plus size={22} />
        </button>
      </div>

      {loading && <p className="text-sm text-ink/50 dark:text-paper/50">Cargando fondos…</p>}

      {!loading && funds.length === 0 && (
        <div className="card text-center">
          <p className="mb-1 font-medium text-ink dark:text-paper">Sin fondos activos</p>
          <p className="text-sm text-ink/60 dark:text-paper/60">
            Un fondo es dinero reservado para un propósito específico — como viáticos o un
            proyecto — sin salir de tus bolsillos hasta que lo gastes.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {funds.map((fund) => (
          <FundCard
            key={fund.id}
            fund={fund}
            onEdit={setEditing}
            onDelete={setDeleteTarget}
          />
        ))}
      </div>

      {showModal && (
        <NewFundModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false);
          }}
        />
      )}

      {editing && (
        <EditFundModal
          fund={editing}
          updateFund={updateFund}
          onClose={() => setEditing(null)}
          onUpdated={() => {
            setEditing(null);
          }}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center">
          <div className="modal-panel">
            <h2 className="mb-2 font-display text-xl text-ink dark:text-paper">
              ¿Eliminar fondo?
            </h2>
            <p className="mb-2 text-sm text-ink/70 dark:text-paper/70">
              {hasSpent ? (
                <>
                  Este fondo tiene gastos asociados por{" "}
                  <strong className="text-ink dark:text-paper">
                    {formatCurrency(deleteTarget.spent)}
                  </strong>
                  . Al eliminarlo, esos gastos se conservarán en tu historial pero quedarán sin
                  fondo asociado.
                </>
              ) : (
                <>Se eliminará el fondo sin afectar tus demás datos.</>
              )}
            </p>
            <p className="mb-6 text-sm text-brick">Esta acción no se puede deshacer.</p>

            {deleteError && <p className="mb-3 text-sm text-brick">{deleteError}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 rounded-chip bg-ink/5 px-4 py-3 text-sm font-medium text-ink dark:bg-paper/10 dark:text-paper"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 rounded-chip bg-brick px-4 py-3 text-sm font-medium text-paper hover:bg-brick-light"
              >
                {deleting ? "Eliminando…" : "Eliminar fondo"}
              </button>
            </div>
          </div>
        </div>
      )}
      </AuthGate>
    </AppLayout>
  );
}