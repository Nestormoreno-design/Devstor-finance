import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import AuthGate from "../components/AuthGate";
import PocketCard from "../components/PocketCard";
import NewPocketModal from "../components/NewPocketModal";
import EditPocketModal from "../components/EditPocketModal";
import AddMoneyModal from "../components/AddMoneyModal";
import {
  createPocket,
  fetchPockets,
  updatePocket,
  deletePocket,
} from "../services/pockets.service";
import { formatCurrency } from "../utils/formatCurrency";

export default function Pockets() {
  const [pockets, setPockets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [addTarget, setAddTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    let cancelled = false;
    console.log("[POCKETS][PAGE] load start", performance.now());
    setLoading(true);
    fetchPockets()
      .then((data) => {
        if (!cancelled) {
          console.log("[POCKETS][PAGE] load end", performance.now());
          setPockets(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("[POCKETS][PAGE] load error", err, performance.now());
        }
      })
      .finally(() => {
        if (!cancelled) {
          console.log("[POCKETS][PAGE] load end (finally)", performance.now());
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const total = pockets.reduce((sum, p) => sum + parseFloat(p.balance), 0);

  function requestDelete(pocket) {
    setDeleteError("");
    setDeleteTarget(pocket);
  }

  async function confirmDelete() {
    setDeleting(true);
    setDeleteError("");
    try {
      await deletePocket(deleteTarget.id);
      await load();
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(
        err.response?.data?.detail || "No pudimos eliminar el bolsillo."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppLayout>
      <AuthGate>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm text-ink/50 dark:text-paper/50">Tienes</p>
          <h1 className="font-display text-3xl text-ink dark:text-paper">
            {formatCurrency(total)}
          </h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-pine text-paper shadow-sm"
          aria-label="Nuevo bolsillo"
        >
          <Plus size={22} />
        </button>
      </div>

      {loading && <p className="text-sm text-ink/50 dark:text-paper/50">Cargando bolsillos…</p>}

      {!loading && pockets.length === 0 && (
        <div className="card text-center">
          <p className="mb-1 font-medium text-ink dark:text-paper">Aún no tienes bolsillos</p>
          <p className="text-sm text-ink/60 dark:text-paper/60">
            Crea tu primer bolsillo — puede ser tu cuenta de banco, Nequi, o simplemente
            efectivo — para empezar a registrar tus movimientos.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {pockets.map((pocket) => (
          <PocketCard
            key={pocket.id}
            pocket={pocket}
            onClick={() => {}}
            onEdit={setEditing}
            onDelete={requestDelete}
            onAddMoney={setAddTarget}
          />
        ))}
      </div>

      {showModal && (
        <NewPocketModal
          createPocket={createPocket}
          onClose={() => setShowModal(false)}
          onCreated={(pocket) => {
            setPockets((prev) => [...prev, pocket]);
            setShowModal(false);
          }}
        />
      )}

      {editing && (
        <EditPocketModal
          pocket={editing}
          updatePocket={updatePocket}
          onClose={() => setEditing(null)}
          onUpdated={(saved) => {
            setPockets((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
            setEditing(null);
          }}
        />
      )}

      {addTarget && (
        <AddMoneyModal
          pocket={addTarget}
          onClose={() => setAddTarget(null)}
          onCreated={() => {
            setAddTarget(null);
          }}
        />
      )}

      {deleteTarget && (() => {
        const hasMoney = parseFloat(deleteTarget.balance) > 0;
        const hasMovements = (deleteTarget.movement_count ?? 0) > 0;

        if (hasMoney) {
          return (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center">
              <div className="modal-panel">
                <h2 className="mb-2 font-display text-xl text-ink dark:text-paper">
                  Este bolsillo no se puede eliminar
                </h2>
                <p className="mb-6 text-sm text-ink/70 dark:text-paper/70">
                  El bolsillo todavía tiene {formatCurrency(deleteTarget.balance)} disponibles.
                  Para eliminarlo, primero debes retirar o transferir todo el dinero a otro
                  bolsillo.
                </p>
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="btn-primary"
                >
                  Entendido
                </button>
              </div>
            </div>
          );
        }

        if (hasMovements) {
          return (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center">
              <div className="modal-panel">
                <h2 className="mb-2 font-display text-xl text-ink dark:text-paper">
                  ¿Eliminar bolsillo?
                </h2>
                <p className="mb-2 text-sm text-ink/70 dark:text-paper/70">
                  Este bolsillo no tiene dinero actualmente, pero tiene{" "}
                  {deleteTarget.movement_count}{" "}
                  {deleteTarget.movement_count === 1 ? "movimiento" : "movimientos"} registrados.
                </p>
                <p className="mb-6 text-sm text-brick">
                  Si eliminas este bolsillo, se eliminará también el historial asociado a él.
                  Esta acción no se puede deshacer.
                </p>

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
                    {deleting ? "Eliminando…" : "Eliminar bolsillo"}
                  </button>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center">
            <div className="modal-panel">
              <h2 className="mb-2 font-display text-xl text-ink dark:text-paper">
                ¿Eliminar bolsillo?
              </h2>
              <p className="mb-6 text-sm text-ink/70 dark:text-paper/70">
                Este bolsillo no tiene dinero ni movimientos registrados.
                <br />
                ¿Deseas eliminarlo?
              </p>

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
                  {deleting ? "Eliminando…" : "Eliminar"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      </AuthGate>
    </AppLayout>
  );
}