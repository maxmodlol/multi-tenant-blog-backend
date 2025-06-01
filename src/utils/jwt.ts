import jwt from "jsonwebtoken";
import { Role } from "../types/Role";

export const COOKIE_NAME = "auth";
export const TOKEN_TTL = 60 * 60 * 2; // 2 h in seconds
export const COOKIE_TTL = 60 * 60 * 2;
export function signJWT(id: string, email: string, role: Role, tenant: string) {
  return jwt.sign({ sub: id, email, role, tenant }, process.env.JWT_SECRET!, {
    expiresIn: TOKEN_TTL,
  });
}
