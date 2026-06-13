const monthKeyPattern = /^\d{4}-\d{2}$/;

export function getCurrentMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function normalizeMonthKey(value: string | undefined, fallback = getCurrentMonthKey()) {
  if (!value || !monthKeyPattern.test(value)) {
    return fallback;
  }

  return value;
}

export function getMonthDateRange(referenceMonth: string) {
  const [yearValue, monthValue] = referenceMonth.split("-").map(Number);
  const lastDay = new Date(yearValue, monthValue, 0).getDate();

  return {
    startDate: `${referenceMonth}-01`,
    endDate: `${referenceMonth}-${String(lastDay).padStart(2, "0")}`,
  };
}

export function formatReferenceMonth(referenceMonth: string) {
  const [yearValue, monthValue] = referenceMonth.split("-").map(Number);

  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(yearValue, monthValue - 1, 1));
}

export function getTodayDateKey(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
