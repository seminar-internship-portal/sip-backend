import { Router } from "express";
import studentData from "../controllers/student.controller.js";

const router = Router();

router.route("/student").get(studentData);
export default router;
