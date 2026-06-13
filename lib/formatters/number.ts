export const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export const literFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

export function formatCurrency(value: number) {
  return brlFormatter.format(value);
}

export function formatLiters(value: number) {
  return `${literFormatter.format(value)} L`;
}
