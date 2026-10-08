import { Router } from "express";
import { register, login, me } from "../controllers/authController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { validateRegister, validateLogin } from "../middleware/validator.js";

const router = Router();

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.get("/me", authenticate, me);

export default router;
