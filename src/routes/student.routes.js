import { Router } from "express";
import {
  getData,
  loginStudent,
  logoutStudent,
  getIndividualStudent,
  getStudentMarks,
  changeCurrentPassword,
  updateAccountDetails,
  updateStudentAvatar,
} from "../controllers/student.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/login").post(loginStudent);

//secured routes - > logout and accesstoken wale
router.use(verifyJWT);
router.route("/logout").post(logoutStudent);

router.route("/").get(getData);
router.route("/:studId/seminar/marks").get(getStudentMarks("seminar"));
router.route("/:studId/internship/marks").get(getStudentMarks("internship"));
router.route("/:uniqueId").get(getIndividualStudent);

router
  .route("/changeAvatar")
  .post(upload.single("avatar"), updateStudentAvatar);

router.route("/changePassword").post(changeCurrentPassword);
router.route("/updateAccountDetails").post(updateAccountDetails);

export default router;
