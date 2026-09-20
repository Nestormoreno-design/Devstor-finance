import { NavLink } from "react-router-dom";
import { Home, Wallet, ArrowLeftRight, PiggyBank, MoreHorizontal } from "lucide-react";

const items = [
  { to: "/", label: "Inicio", icon: Home, end: true },
  { to: "/movimientos", label: "Movimientos", icon: ArrowLeftRight },
  { to: "/bolsillos", label: "Bolsillos", icon: Wallet },
  { to: "/fondos", label: "Fondos", icon: PiggyBank },
  { to: "/mas", label: "Más", icon: MoreHorizontal },
];

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 backdrop-blur dark:border-line-dark dark:bg-ink/95">
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {items.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 text-[11px] transition-colors ${
                  isActive ? "text-pine dark:text-pine-light" : "text-ink/50 dark:text-paper/50"
                }`
              }
            >
              <Icon size={22} strokeWidth={1.8} />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
