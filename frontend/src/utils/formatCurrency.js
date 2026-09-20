export function formatCurrency(value, currency = "COP") {
  const number = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(number)) return "—";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(number);
}
