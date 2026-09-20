import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import AppLayout from "../layouts/AppLayout";
import PocketCard from "../components/PocketCard";
import CustomSelect from "../components/CustomSelect";
import { useAuth } from "../context/AuthContext";
import AuthGate from "../components/AuthGate";
import { fetchDashboard } from "../services/dashboard.service";
import { formatCurrency } from "../utils/formatCurrency";

const PERIODS = [
  { value: "this_week", label: "Esta semana" },
  { value: "this_month", label: "Este mes" },
  { value: "last_month", label: "Mes anterior" },
  { value: "last_3_months", label: "Últimos 3 meses" },
  { value: "this_year", label: "Este año" },
];

const CHART_COLORS = ["#1F6E5C", "#C8963E", "#B3492F", "#2C8A73", "#E0B364", "#C96B52"];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [period, setPeriod] = useState("this_month");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    fetchDashboard(period)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.detail || "No pudimos cargar el dashboard.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [period]);

  const showLoader = loading && !data;

  return (
    <AppLayout>
      <AuthGate>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-sm text-ink/50 dark:text-paper/50">Hola,</p>
          <h1 className="font-display text-2xl text-ink dark:text-paper">
            {user?.username || user?.full_name || "Bienvenido"}
          </h1>
        </div>
        <button onClick={logout} className="mt-1 text-ink/40 dark:text-paper/40" aria-label="Cerrar sesión">
          <LogOut size={20} />
        </button>
      </div>

      <div className="card mb-4">
        <p className="text-sm text-ink/50 dark:text-paper/50">Dinero total</p>
        <p className="font-display text-3xl text-ink dark:text-paper">
          {data ? formatCurrency(data.total_balance) : "—"}
        </p>
      </div>

      <div className="mb-4">
        <CustomSelect
          ariaLabel="Período"
          value={period}
          onChange={setPeriod}
          options={PERIODS}
          placeholder="Período"
        />
      </div>

      {showLoader && <p className="text-sm text-ink/50 dark:text-paper/50">Cargando…</p>}

      {!data && !loading && (
        <div className="card text-center">
          {error ? (
            <p className="text-sm text-brick">{error}</p>
          ) : (
            <p className="text-sm text-ink/50 dark:text-paper/50">Cargando…</p>
          )}
        </div>
      )}

      {data && (
        <>
          {error && !loading && (
            <p className="mb-3 text-sm text-brick">{error}</p>
          )}

          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="card">
              <p className="text-xs text-ink/50 dark:text-paper/50">Ingresos</p>
              <p className="font-display text-lg text-pine">{formatCurrency(data.period_income)}</p>
            </div>
            <div className="card">
              <p className="text-xs text-ink/50 dark:text-paper/50">Gastos</p>
              <p className="font-display text-lg text-brick">{formatCurrency(data.period_expenses)}</p>
            </div>
            <div className="card">
              <p className="text-xs text-ink/50 dark:text-paper/50">Balance</p>
              <p className="font-display text-lg text-ink dark:text-paper">
                {formatCurrency(data.balance)}
              </p>
            </div>
            <div className="card">
              <p className="text-xs text-ink/50 dark:text-paper/50">Tasa de ahorro</p>
              <p className="font-display text-lg text-ink dark:text-paper">{data.savings_rate}%</p>
            </div>
          </div>

          {data.expenses_by_category.length > 0 && (
            <div className="card mb-4">
              <p className="mb-2 text-sm font-medium text-ink dark:text-paper">Gastos por categoría</p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.expenses_by_category}
                      dataKey="total"
                      nameKey="category_name"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {data.expenses_by_category.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 space-y-1">
                {data.expenses_by_category.map((c, i) => (
                  <div key={c.category_name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-ink/70 dark:text-paper/70">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                      {c.category_name}
                    </span>
                    <span className="text-ink/60 dark:text-paper/60">{formatCurrency(c.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="mb-2 text-sm font-medium text-ink dark:text-paper">Tus bolsillos</p>
          <div className="space-y-3">
            {data.pockets.map((p) => (
              <PocketCard key={p.id} pocket={p} />
            ))}
          </div>
        </>
      )}
      </AuthGate>
    </AppLayout>
  );
}