import { Router } from "express";
import {
  getData,
  loginStudent,
  logoutStudent,
  getIndividualStudent,
  getStudentMarks,
  changeCurrentPassword,
  updateAccountDetails,
} from "../controllers/student.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/").get(getData);
router.route("/:studId/seminar/marks").get(getStudentMarks("seminar"));
router.route("/:studId/internship/marks").get(getStudentMarks("internship"));
router.route("/:uniqueId").get(getIndividualStudent);

router.route("/login").post(loginStudent);

//secured routes - > logout and accesstoken wale
router.route("/logout").post(verifyJWT, logoutStudent);
router.route("/changePassword").post(verifyJWT, changeCurrentPassword);
router.route("/updateAccountDetails").post(verifyJWT, updateAccountDetails);

export default router;
