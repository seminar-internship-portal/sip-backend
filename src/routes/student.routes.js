import { Router } from "express";
import {
  getData,
  registerStudent,
} from "../controllers/student.controller.js";

const router = Router();

router.route("/").get(getData);
router.route("/register").post(registerStudent);

export default router;
