import express from "express";
import * as authController from "../controllers/authController";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/change-password", authMiddleware, authController.changePassword);
router.put("/language", authMiddleware, authController.updateLanguage);
router.post("/push-token", authMiddleware, authController.updatePushToken);
router.get("/profile", authMiddleware, authController.getProfile);

export default router;
