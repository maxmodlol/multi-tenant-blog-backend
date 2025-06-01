// src/routes/tenantRoutes.ts
import { Router, Request, Response, NextFunction } from "express";
import { listTenants } from "../services/tenantService";

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

export default router;
