import { Router } from "express";
import {
  getAllMentors,
  registerMentor,
  loginMentor,
  logoutMentor,
} from "../controllers/mentor.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = new Router();
router.route("/").get(getAllMentors);
router.route("/register").post(registerMentor);
router.route("/login").post(loginMentor);

// secured routes
router.route("/logout").post(verifyJWT, logoutMentor);

export default router;
