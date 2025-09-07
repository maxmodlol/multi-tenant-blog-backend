import { Router } from "express";
import {
  getDashboardBlogsController,
  getDashboardBlogByIdController,
  createBlogController,
  updateBlogController,
  updateBlogStatusController,
  deleteBlogController,
} from "../controller/blogController";
import { jwtAuth } from "../middleware/jwtAuth";
import { upload } from "../middleware/upload";
import { uploadImageController as uploadControllerSingle } from "../controller/uploadController";
import { Role } from "../types/Role";
import { roleAuthorization } from "../middleware/roleAuthorization";
import {
  getAdminMetrics,
  getPerTenantMetrics,
  getBlogStatusTimeseries,
} from "../services/metricsService";

const dash = Router();

dash.use(jwtAuth()); // protect everything below

// LIST blogs
dash.get("/", getDashboardBlogsController); // GET    /api/dashboard/blogs

// CREATE blog
dash.post("/", upload.single("coverPhoto"), createBlogController); // POST   /api/dashboard/blogs

// SINGLE blog operations
dash.get("/:id", getDashboardBlogByIdController); // GET    /api/dashboard/blogs/:id
dash.patch("/:id", updateBlogController); // PATCH  /api/dashboard/blogs/:id
dash.patch("/:id/status", updateBlogStatusController); // PATCH  /api/dashboard/blogs/:id/status
dash.delete("/:id", deleteBlogController); // DELETE /api/dashboard/blogs/:id

// UPLOAD image (keep **before** any "/:id" POST routes to avoid conflicts)
dash.post("/upload-image", upload.single("file"), uploadControllerSingle);

// Admin metrics
dash.get(
  "/metrics/admin",
  roleAuthorization([Role.ADMIN]),
  async (req, res, next) => {
    try {
      const data = await getAdminMetrics();
      res.json(data);
    } catch (err) {
      next(err);
    }
  },
);

// Admin per-tenant metrics
dash.get(
  "/metrics/admin/tenants",
  roleAuthorization([Role.ADMIN]),
  async (req, res, next) => {
    try {
      const data = await getPerTenantMetrics();
      res.json({ tenants: data });
    } catch (err) {
      next(err);
    }
  },
);

// Timeseries for charts (admin or publisher for own tenant)
dash.get("/metrics/timeseries", async (req, res, next) => {
  try {
    const user = (req as any).user;
    const rawDays = (req.query.days as string) || "30";
    const days = rawDays === "all" ? ("all" as const) : parseInt(rawDays, 10);
    let tenant = (req.query.tenant as string) || user.tenant;
    if (user.role !== "ADMIN") tenant = user.tenant;
    const data = await getBlogStatusTimeseries(tenant, days);
    res.json({ points: data });
  } catch (err) {
    next(err);
  }
});

export default dash;
