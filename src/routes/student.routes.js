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
  addSeminarDetails,
  addInternshipDetails,
  getStudentDetails,
  updateStudentDetails,
  getAllInfo,
  getCompanyNames,
  studentsUnderCompany,
} from "../controllers/student.controller.js";
import {
  uploadReport,
  uploadAbstract,
  uploadPPT,
  uploadPermissionLetter,
  uploadCompletionLetter,
  uploadOfferLetter,
  deleteInternship,
} from "../controllers/docs.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/login").post(loginStudent);

//secured routes - > logout and accesstoken wale
router.use(verifyJWT);
router.route("/logout").post(logoutStudent);

router.route("/").get(getData);
router.route("/internship").get(getAllInfo("internship"));
router.route("/internship/company/:companyName").get(studentsUnderCompany);
router.route("/internship/company").get(getCompanyNames);
router.route("/seminar").get(getAllInfo("seminar"));
router.route("/:studId/seminar/marks").get(getStudentMarks("seminar"));
router.route("/:studId/internship/marks").get(getStudentMarks("internship"));
router.route("/:studId/internship").get(getStudentDetails("internship"));
router
  .route("/:studId/internship/:internshipId")
  .patch(updateStudentDetails("internship"));
router
  .route("/:studId/seminar")
  .get(getStudentDetails("seminar"))
  .patch(updateStudentDetails("seminar"));
router.route("/:uniqueId").get(getIndividualStudent);

router.route("/login").post(loginStudent);

//secured routes - > logout and accesstoken wale
router.route("/logout").post(verifyJWT, logoutStudent);

router.route("/changePassword").post(verifyJWT, changeCurrentPassword);
router.route("/updateAccountDetails").post(verifyJWT, updateAccountDetails);
//docs
router.route("/addSeminarDetails").post(verifyJWT, addSeminarDetails);
router.route("/addInternshipDetails").post(verifyJWT, addInternshipDetails);
router
  .route("/changeAvatar")
  .post(upload.single("avatar"), updateStudentAvatar);

router
  .route("/uploadReport")
  .post(verifyJWT, upload.single("report"), uploadReport);

router
  .route("/uploadAbstract")
  .post(verifyJWT, upload.single("abstract"), uploadAbstract);

router.route("/uploadppt").post(verifyJWT, upload.single("ppt"), uploadPPT);
//internship
router
  .route("/uploadOfferLetter")
  .post(verifyJWT, upload.single("offerLetter"), uploadOfferLetter);
router
  .route("/uploadCompletionLetter")
  .post(verifyJWT, upload.single("completionLetter"), uploadCompletionLetter);
router
  .route("/uploadPermissionLetter")
  .post(verifyJWT, upload.single("permissionLetter"), uploadPermissionLetter);

//delete routes
router.route("/deleteInternship/:id").delete(verifyJWT, deleteInternship);

export default router;
