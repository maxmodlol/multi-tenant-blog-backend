// src/middleware/jwtAuth.ts        – type-safe & response once only
import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { COOKIE_NAME } from "../utils/jwt";
import { Role } from "../types/Role";

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  tenant: string;
  iat: number;
  exp: number;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: JwtPayload;
  }
}

export const jwtAuth =
  (required = true): RequestHandler =>
  (req, res, next) => {
    const token =
      req.cookies?.[COOKIE_NAME] ?? req.headers.authorization?.split(" ")[1];

    /* ─────── no token ─────── */
    if (!token) {
      if (required) {
        res.status(401).json({ error: "Unauthorized" });
      } else {
        next();
      }
      return; // ← stop here
    }

    /* ───── verify token ───── */
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
      next();
    } catch {
      if (required) res.status(401).json({ error: "Token expired" });
      else next();
    }
  };
