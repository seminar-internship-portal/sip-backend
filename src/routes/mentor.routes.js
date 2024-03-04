import { Router } from "express";
import {
  getAllMentors,
  loginMentor,
  logoutMentor,
  evaluateStudent,
  getIndividualMentor,
  changeCurrentPassword,
  updateAccountDetails,
} from "../controllers/mentor.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = new Router();
router.route("/").get(getAllMentors);
// router.route("/register").post(registerMentor);
router.route("/login").post(loginMentor);
router.route("/seminar/evaluate/:studId").post(evaluateStudent("seminar"));
router
  .route("/internship/evaluate/:studId")
  .post(evaluateStudent("internship"));
router.route("/:uniqueId").get(getIndividualMentor);

// secured routes
router.route("/logout").post(verifyJWT, logoutMentor);
router.route("/changePassword").post(verifyJWT, changeCurrentPassword);
router.route("/updateAccountDetails").post(verifyJWT, updateAccountDetails);

export default router;
