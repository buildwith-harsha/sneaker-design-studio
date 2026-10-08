import { Router } from "express";
import { DesignController } from "../controllers/designController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { validateDesignPayload } from "../middleware/validator.js";

const router = Router();
const designController = new DesignController();

// Protect all design endpoints
router.use(authenticate);

// Design CRUD routes
router.get("/", designController.getAllDesigns.bind(designController));
router.post(
  "/",
  validateDesignPayload,
  designController.createDesign.bind(designController),
);
router.get("/:id", designController.getDesignById.bind(designController));
router.put(
  "/:id",
  validateDesignPayload,
  designController.updateDesign.bind(designController),
);
router.delete("/:id", designController.deleteDesign.bind(designController));

// Version history routes
router.get(
  "/:id/versions",
  designController.getVersions.bind(designController),
);
router.post(
  "/:id/versions/:versionNumber/restore",
  designController.restoreVersion.bind(designController),
);

export default router;
