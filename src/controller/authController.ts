// controller/authController.ts
import { Request, RequestHandler, Response } from "express";
import bcrypt from "bcrypt";
import { findUserWithRole } from "../services/userService";
import { getTenantFromReq } from "../utils/getTenantFromReq";
import { serialize } from "cookie";
import { signJWT, COOKIE_NAME, COOKIE_TTL } from "../utils/jwt";

// POST /main/auth/login

export async function loginController(req: Request, res: Response) {
  const tenant = getTenantFromReq(req);
  const { email, password } = req.body;

  console.log("🔐 login attempt →", { email, tenant });

  const found = await findUserWithRole(email, tenant);
  if (!found) {
    console.log("❌ user not found or not linked to this tenant");
    res.status(401).json({ error: "Not Found" });
    return;
  }

  const { user, link } = found;

  const passwordMatches = await bcrypt.compare(password, user.password);
  console.log("🔐 passwordMatches:", passwordMatches);

  if (!passwordMatches) {
    console.log("❌ bad credentials");
    res.status(401).json({ error: "Bad credentials" });
    return;
  }

  const token = signJWT(user.id, user.email, link.role, link.tenant);

  res.setHeader(
    "Set-Cookie",
    serialize(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: COOKIE_TTL,
      path: "/",
      domain: process.env.MAIN_DOMAIN || "localhost",
    }),
  );

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: link.role,
      tenant: link.tenant,
    },
    token,
  });
}

export const meController: RequestHandler = (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthenticated" });
    return; // ← early exit
  }

  const { sub: id, email, role, tenant } = req.user;
  res.json({ id, email, role, tenant }); // ← no “return”
};

/* ------------------------------------------------------------------ */
/* POST /api/auth/logout  – clear cookie                              */
/* ------------------------------------------------------------------ */
export const logoutController: RequestHandler = (_req, res) => {
  res.setHeader(
    "Set-Cookie",
    serialize(COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0, // expire immediately
      path: "/",
      domain: process.env.MAIN_DOMAIN || "localhost",
    }),
  );
  res.status(204).end(); // 204 No-Content
};
