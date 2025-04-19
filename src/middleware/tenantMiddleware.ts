// src/middleware/tenantMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { config } from 'dotenv';

config();

const mainDomain = process.env.MAIN_DOMAIN || "localhost"; // e.g., "mynashra.com" in production

const tenantMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const host = req.headers.host; // e.g., "publisher1.mynashra.com:5000" or "mynashra.com:5000"
  if (host) {
    // Remove the port if present
    const hostname = host.split(':')[0];
    console.log("hostname",hostname);
    // Check if hostname equals the main domain or ends with the main domain but without a subdomain.
    if (hostname === mainDomain || hostname === `www.${mainDomain}`) {
      (req as any).tenant = "main";
    } else if (hostname.endsWith(mainDomain)) {
      // For example: "publisher1.mynashra.com" -> split and take the first segment
      const parts = hostname.split('.');
      // If the domain is "publisher1.mynashra.com", parts = ["publisher1", "mynashra", "com"]
      // We assume subdomain exists if parts.length > 2
      (req as any).tenant = parts.length > 1 ? parts[0] : "main";
    } else {
      // If host does not match the main domain at all, default to "main"
      (req as any).tenant = "main";
    }
  } else {
    (req as any).tenant = "main";
  }
  next();
};

export default tenantMiddleware;
