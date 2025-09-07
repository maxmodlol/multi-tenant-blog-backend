// src/routes/tenantRoutes.ts
import { Router, Request, Response, NextFunction } from "express";
import { listTenants } from "../services/tenantService";
import {
  provisionSubdomain,
  deleteSubdomain,
} from "../services/subdomainService";
import { jwtAuth } from "../middleware/jwtAuth";
import { roleAuthorization } from "../middleware/roleAuthorization";
import { Role } from "../types/Role";

const router = Router();

/**
 * GET /tenants
 * Returns all tenants (id + domain), sorted by domain ascending.
 */
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenants = await listTenants();
    // Only send back the fields your frontend needs
    const payload = tenants.map((t) => ({
      id: t.id,
      domain: t.domain,
    }));
    res.json({ tenants: payload });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /tenants
 * Admin-only: create a new tenant subdomain (validations enforced).
 * body: { domain: string }
 */
router.post(
  "/",
  jwtAuth(),
  roleAuthorization([Role.ADMIN]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { domain } = req.body as { domain?: string };
      if (!domain) {
        res.status(400).json({ error: "domain is required" });
        return;
      }
      const t = await provisionSubdomain(domain);
      res.status(201).json({ id: t.id, domain: t.domain });
    } catch (err) {
      next(err);
    }
  },
);

export default router;

/**
 * DELETE /tenants/:domain
 * Admin-only: delete a tenant (drops schema and removes record).
 */
router.delete(
  "/:domain",
  jwtAuth(),
  roleAuthorization([Role.ADMIN]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { domain } = req.params as { domain: string };
      await deleteSubdomain(domain);
      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  },
);
