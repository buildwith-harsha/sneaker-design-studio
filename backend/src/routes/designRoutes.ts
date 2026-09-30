import { Router } from "express";

import { DesignController } from "../controllers/designController.js";

const router = Router();

const designController = new DesignController();

router.get("/", designController.getAllDesigns.bind(designController));

router.post("/", designController.createDesign.bind(designController));

router.get("/:id", designController.getDesignById.bind(designController));

router.put("/:id", designController.updateDesign.bind(designController));

router.delete("/:id", designController.deleteDesign.bind(designController));

export default router;
