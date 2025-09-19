import { Router } from "express";
import {
  listAdSettingsController,
  createAdSettingController,
  updateAdSettingController,
  deleteAdSettingController,
} from "../controller/adSettingController";
import { jwtAuth } from "../middleware/jwtAuth";
import { roleAuthorization } from "../middleware/roleAuthorization";
import { Role } from "../types/Role";

const router = Router();

router.get("/", listAdSettingsController);
router.post(
  "/",
  jwtAuth(),
  roleAuthorization([Role.ADMIN]),
  createAdSettingController
);
router.put(
  "/:id",
  jwtAuth(),
  roleAuthorization([Role.ADMIN]),
  updateAdSettingController
);
router.delete(
  "/:id",
  jwtAuth(),
  roleAuthorization([Role.ADMIN]),
  deleteAdSettingController
);

export default router;
