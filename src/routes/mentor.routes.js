import { Router } from "express";
import {
  getAllMentors,
  registerMentor,
} from "../controllers/mentor.controller.js";

const router = new Router();
router.route("/").get(getAllMentors);
router.route("/register").post(registerMentor);

export default router;
