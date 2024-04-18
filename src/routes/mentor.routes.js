import { Router } from "express";
import {
  getAllMentors,
  loginMentor,
  logoutMentor,
  evaluateStudent,
  getIndividualMentor,
  changeCurrentPassword,
  updateAccountDetails,
  updateMentorAvatar,
  studentAssigned,
  getStudentInfoWithMarks,
} from "../controllers/mentor.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyRole } from "../middlewares/role.middlware.js";

const router = new Router();

router.route("/login").post(loginMentor);

// secured routes
router.use(verifyJWT);
router.route("/logout").post(logoutMentor);
router.route("/").get(getAllMentors);
router.route("/:uniqueId").get(getIndividualMentor);
router.route("/studentAssigned/:mentorId").get(studentAssigned);
router.route("/getStudentInfoWithMarks/:id").get(getStudentInfoWithMarks);

router.route("/changeAvatar").post(upload.single("avatar"), updateMentorAvatar);

router.route("/changePassword").post(changeCurrentPassword);
router.route("/updateAccountDetails").post(updateAccountDetails);

// mentor only routes
router.use(verifyRole("mentor"));
router.route("/seminar/evaluate/:studId").post(evaluateStudent("seminar"));
router
  .route("/internship/evaluate/:studId")
  .post(evaluateStudent("internship"));

export default router;
