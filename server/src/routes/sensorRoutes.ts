import express from "express";
import * as sensorController from "../controllers/sensorController";
import { upload } from "../middleware/upload";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

router.get("/status", authMiddleware, sensorController.getSensorStatus);
router.post("/status", sensorController.updateSensorStatus);
router.post("/image", upload.single("image"), sensorController.uploadImage);

export default router;
