import { Request } from "express";
import { parseTenant } from "../middleware/tenant";

export function getTenantFromReq(req: Request): string {
  const hostHeader =
    req.get("x-forwarded-host") || req.get("host") || "" || undefined;

  const tenant = parseTenant(hostHeader);
  console.log("getTenantFromReq:", { hostHeader, tenant });
  return tenant;
}
