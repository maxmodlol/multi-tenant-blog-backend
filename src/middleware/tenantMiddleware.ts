import { Request, Response, NextFunction } from "express";

// src/middleware/tenantMiddleware.ts
const mainDomain = process.env.MAIN_DOMAIN || "localhost"; // e.g. localhost

function extractTenant(hostHeader: string | undefined) {
  if (!hostHeader) return "main";

  const hostname = hostHeader.split(":")[0]; // drop :3000
  const host = hostname.replace(/:\d+$/, ""); // safety

  // dev-mode special case ── publisher1.localhost
  if (host.endsWith(".localhost")) {
    const [sub] = host.split(".");
    return sub || "main";
  }

  // prod ── publisher1.mynashra.com
  if (host === mainDomain || host === `www.${mainDomain}`) return "main";
  if (host.endsWith(`.${mainDomain}`)) return host.split(".")[0];

  return "main";
}

const tenantMiddleware = (req: Request, _: Response, next: NextFunction) => {
  if ((req as any).tenant) return next();

  (req as any).tenant = extractTenant(req.headers.host);
  next();
};

export default tenantMiddleware;
