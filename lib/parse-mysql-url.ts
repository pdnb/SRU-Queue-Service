export function parseMysqlUrl(url: string) {
  const parsed = new URL(url);

  const config: Record<string, unknown> = {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
    connectionLimit: 5,
  };

  const sslMode = parsed.searchParams.get("sslaccept");
  if (sslMode === "strict" || parsed.searchParams.get("ssl") === "true") {
    config.ssl = { rejectUnauthorized: sslMode === "strict" };
  }

  const connectTimeout = parsed.searchParams.get("connect_timeout");
  if (connectTimeout) {
    config.connectTimeout = Number(connectTimeout) * 1000;
  }

  return config;
}
