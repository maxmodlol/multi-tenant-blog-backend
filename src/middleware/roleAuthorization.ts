// src/middleware/roleAuthorization.ts
import { Request, Response, NextFunction, RequestHandler } from "express";
import { Role } from "../types/Role";

export const roleAuthorization =
  (roles: Role[], tenantScope: "any" | "same" = "same"): RequestHandler =>
  (req, res, next) => {
    if (!req.user) {
      res.status(401).end();
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).end();
      return;
    }
    if (
      tenantScope === "same" &&
      req.user.role !== Role.ADMIN &&
      req.user.tenant !== req.params.tenant
    ) {
      res.status(403).end();
      return;
    }

    next();
  };
