// src/middleware/tenantMiddleware.ts

import { Request, Response, NextFunction } from "express";

// ✅ In your .env.production (or in Plesk’s Custom env vars) set:
//    MAIN_DOMAIN=alnashra.co
const MAIN_DOMAIN = process.env.MAIN_DOMAIN!;

// Any subdomains here should map to the global “main” tenant:
const RESERVED = ["www", "api", "admin", "auth"];

function extractTenant(hostHeader: string | undefined) {
  if (!hostHeader) return "main";

  const hostname = hostHeader.split(":")[0].toLowerCase().trim();
  const parts = hostname.split(".");

  // 1. localhost or no dot => main
  if (hostname === "localhost" || parts.length === 1) {
    return "main";
  }

  // 2. any reserved service name => main
  if (RESERVED.includes(parts[0])) {
    return "main";
  }

  // 3. publisher subdomain in dev
  if (hostname.endsWith(`.localhost`)) {
    return parts[0];
  }

  // 4. production root or www => main
  if (hostname === MAIN_DOMAIN || hostname === `www.${MAIN_DOMAIN}`) {
    return "main";
  }

  // 5. real publisher subdomain => first segment
  if (hostname.endsWith(`.${MAIN_DOMAIN}`)) {
    return parts[0];
  }

  // fallback
  return "main";
}

export default function tenantMiddleware(
  req: Request,
  _: Response,
  next: NextFunction
) {
  // already set by x-tenant header?
  if ((req as any).tenant) {
    return next();
  }

  (req as any).tenant = extractTenant(req.headers.host);
  console.log(
    `[TENANT] host=${req.headers.host} → tenant= ${(req as any).tenant}`
  );
  next();
}
