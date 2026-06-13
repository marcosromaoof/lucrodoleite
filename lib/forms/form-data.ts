export function readString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function readRequiredString(formData: FormData, key: string) {
  return readString(formData, key) ?? "";
}

export function readNumber(formData: FormData, key: string) {
  const value = readString(formData, key);

  if (value === undefined) {
    return undefined;
  }

  const normalized = value.replace(",", ".");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function readInteger(formData: FormData, key: string) {
  const value = readNumber(formData, key);

  if (value === undefined) {
    return undefined;
  }

  return Number.isInteger(value) ? value : Number.NaN;
}
