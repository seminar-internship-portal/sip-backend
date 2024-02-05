import { Router } from "express";
import {
  getData,
  registerStudent,
  loginStudent,
  logoutStudent,
  getIndividualStudent,
} from "../controllers/student.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/").get(getData);
router.route("/:uniqueId").get(getIndividualStudent);

router.route("/register").post(registerStudent);
router.route("/login").post(loginStudent);

//secured routes - > logout and accesstoken wale
router.route("/logout").post(verifyJWT, logoutStudent);

export default router;
