import express from "express";
import * as controlController from "../controllers/controlController";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

router.post("/log", authMiddleware, controlController.logControlAction);
router.post("/led", authMiddleware, controlController.toggleLED);
router.post("/buzzer", authMiddleware, controlController.toggleBuzzer);
router.get("/led/status", authMiddleware, controlController.getLedStatus);
router.get("/buzzer/status", authMiddleware, controlController.getBuzzerStatus);
router.post("/capture", authMiddleware, controlController.captureImage);
router.get("/history", authMiddleware, controlController.getControlHistory);
router.delete("/", authMiddleware, controlController.clearControlHistory);

export default router;
