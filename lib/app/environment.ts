export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getDatabaseStatusLabel() {
  return isDatabaseConfigured() ? "configurado" : "aguardando DATABASE_URL";
}
