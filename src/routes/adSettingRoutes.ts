import { Router } from "express";
import {
  listAdSettingsController,
  createAdSettingController,
  updateAdSettingController,
  deleteAdSettingController,
} from "../controller/adSettingController";
import tenantMiddleware from "../middleware/tenantMiddleware";
import { jwtAuth } from "../middleware/jwtAuth";

const router = Router();
router.use(tenantMiddleware);
router.use(jwtAuth());

router.get("/", listAdSettingsController);
router.post("/", createAdSettingController);
router.put("/:id", updateAdSettingController);
router.delete("/:id", deleteAdSettingController);

export default router;
