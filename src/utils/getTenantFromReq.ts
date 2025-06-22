import { Request } from "express";

export function getTenantFromReq(req: Request): string {
  const host = req.hostname || req.headers.host || "";
  const hostname = host.split(":")[0];
  const parts = hostname.split(".");
  console.log("gettenant  ", host, "hostname", hostname);

  if (hostname === "localhost" || parts.length === 1) return "main";

  return parts[0];
}
