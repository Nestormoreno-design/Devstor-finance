import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight } from "lucide-react";
import { formatCurrency } from "../utils/formatCurrency";

const STYLES = {
  income: { icon: ArrowUpCircle, color: "text-pine", sign: "+" },
  expense: { icon: ArrowDownCircle, color: "text-brick", sign: "-" },
  transfer: { icon: ArrowLeftRight, color: "text-gold", sign: "" },
};

export default function MovementRow({ movement }) {
  const { icon: Icon, color, sign } = STYLES[movement.kind];

  const title =
    movement.kind === "transfer"
      ? `${movement.from_pocket_name} → ${movement.to_pocket_name}`
      : movement.description || movement.category_name || movement.type || "Movimiento";

  const subtitle = [];
  if (movement.kind === "transfer") {
    subtitle.push(movement.description || "Transferencia");
  } else {
    subtitle.push(movement.category_name);
    subtitle.push(movement.pocket_name);
    if (movement.kind === "expense" && movement.fund_name) {
      subtitle.push(movement.fund_name);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b border-line py-3 last:border-0 dark:border-line-dark">
      <div className="flex items-center gap-3">
        <Icon size={20} className={color} strokeWidth={1.8} />
        <div>
          <p className="text-sm font-medium text-ink dark:text-paper">{title}</p>
          <p className="text-xs text-ink/50 dark:text-paper/50">
            {subtitle.filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>
      <p className={`text-sm font-medium ${color}`}>
        {sign}
        {formatCurrency(movement.amount)}
      </p>
    </div>
  );
}
