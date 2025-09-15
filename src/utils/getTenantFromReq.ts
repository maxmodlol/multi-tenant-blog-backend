import { Request } from "express";
import { parseTenant } from "../middleware/tenant";

export function getTenantFromReq(req: Request): string {
  // 1) Respect already-resolved tenant (e.g., from x-tenant header or middleware)
  if ((req as any).tenant && typeof (req as any).tenant === "string") {
    return (req as any).tenant as string;
  }

  // 2) Allow direct x-tenant header override
  const headerTenant = req.get("x-tenant");
  if (headerTenant && typeof headerTenant === "string") {
    return headerTenant;
  }

  // 3) Fallback to host header parsing
  const hostHeader =
    req.get("x-forwarded-host") || req.get("host") || "" || undefined;

  const tenant = parseTenant(hostHeader);
  return tenant;
}
