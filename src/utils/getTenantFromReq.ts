// backend/src/utils/getTenantFromReq.ts
import { Request } from "express";

const RESERVED = ["www", "api", "admin", "auth"];

export function getTenantFromReq(req: Request): string {
  // 1️⃣ grab host from x-forwarded or direct Host header
  const hostHeader = (req.get("x-forwarded-host") || req.get("host") || "")
    .split(":")[0]
    .toLowerCase();

  // 2️⃣ split into parts
  const parts = hostHeader.split(".");
  const sub = parts[0];

  console.log("getTenantFromReq:", { hostHeader, sub, parts });

  // 3️⃣ fallback to “main” when:
  //    • localhost
  //    • no subdomain (parts.length === 1 or === 2)
  //    • reserved service names
  if (sub === "localhost" || parts.length < 3 || RESERVED.includes(sub)) {
    return "main";
  }

  // 4️⃣ otherwise it’s a real tenant
  return sub;
}
