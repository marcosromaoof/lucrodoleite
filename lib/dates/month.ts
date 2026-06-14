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

export type DateRange = {
  endDate: string;
  startDate: string;
};

export function getCycleDateRange(
  referenceMonth: string,
  cycleStartDay = 1,
  cycleEndDay = 31,
): DateRange {
  const [referenceYear, referenceMonthNumber] = referenceMonth.split("-").map(Number);
  const startDay = normalizeCycleDay(cycleStartDay);
  const endDay = normalizeCycleDay(cycleEndDay);
  const startsInPreviousMonth = startDay >= endDay;
  const startMonthIndex = startsInPreviousMonth ? referenceMonthNumber - 2 : referenceMonthNumber - 1;
  const endMonthIndex = referenceMonthNumber - 1;
  const startDate = new Date(referenceYear, startMonthIndex, 1);
  const endDate = new Date(referenceYear, endMonthIndex, 1);

  startDate.setDate(Math.min(startDay, getDaysInMonth(startDate.getFullYear(), startDate.getMonth() + 1)));
  endDate.setDate(Math.min(endDay, getDaysInMonth(endDate.getFullYear(), endDate.getMonth() + 1)));

  return {
    startDate: formatDateKey(startDate),
    endDate: formatDateKey(endDate),
  };
}

export function formatDateRange(startDate: string, endDate: string) {
  return `${formatDateKeyForDisplay(startDate)} a ${formatDateKeyForDisplay(endDate)}`;
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

function normalizeCycleDay(day: number) {
  if (!Number.isFinite(day)) {
    return 1;
  }

  return Math.max(1, Math.min(31, Math.trunc(day)));
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function formatDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatDateKeyForDisplay(dateKey: string) {
  const [yearValue, monthValue, dayValue] = dateKey.split("-").map(Number);

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(yearValue, monthValue - 1, dayValue));
}
