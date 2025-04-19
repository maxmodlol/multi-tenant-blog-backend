// src/middleware/roleAuthorization.ts
import { Request, Response, NextFunction } from "express";
import { Role } from "../types/UserTypes";

/**
 * Returns a middleware function that checks if the user's role is one of the allowed roles.
 * @param allowedRoles An array of allowed roles (e.g. [Role.SUPER_ADMIN, Role.ADMIN])
 */
export const roleAuthorization = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Ensure req.user is available (should be set by jwtAuth)
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized. Missing user token." });
      return;
    }
    if (!allowedRoles.includes(req.user.role as Role)) {
      res.status(403).json({ error: "Forbidden. You do not have access to this resource." });
      return;
    }
    next();
  };
};
