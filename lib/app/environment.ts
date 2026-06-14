export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function isAuthConfigured() {
  return Boolean(process.env.AUTH_SECRET);
}

export function getDatabaseStatusLabel() {
  return isDatabaseConfigured() ? "configurado" : "aguardando DATABASE_URL";
}
