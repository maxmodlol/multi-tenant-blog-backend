// src/middleware/tenantMiddleware.ts

import { Request, Response, NextFunction } from "express";

// ✅ In your .env.production (or in Plesk’s Custom env vars) set:
import { parseTenant } from "./tenant";

export default function tenantMiddleware(
  req: Request,
  _: Response,
  next: NextFunction,
) {
  // already set by x-tenant header?
  if ((req as any).tenant) {
    return next();
  }

  (req as any).tenant = parseTenant(req.headers.host);
  console.log(
    `[TENANT] host=${req.headers.host} → tenant= ${(req as any).tenant}`,
  );
  next();
}
