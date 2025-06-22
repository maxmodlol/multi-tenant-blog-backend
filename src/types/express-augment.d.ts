// src/types/express-augment.d.ts
import type { JwtPayload } from "../middleware/jwtAuth";

// Augment the express-serve-static-core module (where Express's Request is actually defined)
declare module "express-serve-static-core" {
  interface Request {
    user?: JwtPayload;
    tenant?: string;
  }
}

// Export an empty object to ensure this file is treated as a module.
export {};
