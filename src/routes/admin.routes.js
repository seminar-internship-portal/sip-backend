import { Router } from "express";
import {
  deleteCriteria,
  createCriteria,
  getCriterias,
  loginAdmin,
  registerMentor,
  registerStudent,
  registerAdmin,
  logoutAdmin,
  assignMentor,
  removeMentor,
  deleteMentor,
  deleteStudent,
} from "../controllers/admin.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyRole } from "../middlewares/role.middlware.js";

const router = Router();

router.route("/login").post(loginAdmin);
router.route("/register").post(registerAdmin);
//secured
router.use(verifyJWT);
router.route("/logout").post(logoutAdmin);

router.route("/evaluation/seminarCriteria").get(getCriterias("seminar"));
router.route("/evaluation/internshipCriteria").get(getCriterias("internship"));

// admin only routes
router.use(verifyRole("admin"));
router.route("/registerMentor").post(registerMentor);
router.route("/registerStudent").post(registerStudent);
router.route("/deleteStudent/:studId").delete(deleteStudent);
router.route("/deleteMentor/:mentorId").delete(deleteMentor);

router.route("/assignMentor").post(assignMentor);
router.route("/removeMentor").post(removeMentor);

router.route("/evaluation/seminarCriteria").post(createCriteria("seminar"));
router
  .route("/evaluation/internshipCriteria")
  .post(createCriteria("internship"));

router
  .route("/evaluation/seminarCriteria/:id")
  .delete(deleteCriteria("seminar"));
router
  .route("/evaluation/internshipCriteria/:id")
  .delete(deleteCriteria("internship"));

export default router;
