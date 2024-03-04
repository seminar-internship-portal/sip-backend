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
} from "../controllers/admin.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyRole } from "../middlewares/role.middlware.js";

const router = Router();

router.route("/login").post(loginAdmin);
router.route("/register").post(registerAdmin);
//secured
router.route("/logout").post(verifyJWT, logoutAdmin);

router
  .route("/registerMentor")
  .post(verifyRole("admin"), verifyJWT, registerMentor);
router
  .route("/registerStudent")
  .post(verifyRole("admin"), verifyJWT, registerStudent);

router
  .route("/assignMentor")
  .post(verifyRole("admin"), verifyJWT, assignMentor);

router
  .route("/removeMentor")
  .post(verifyRole("admin"), verifyJWT, removeMentor);

router.route("/evaluation/seminarCriteria").post(createCriteria("seminar"));
router.route("/evaluation/seminarCriteria").get(getCriterias("seminar"));
router
  .route("/evaluation/internshipCriteria")
  .post(createCriteria("internship"));
router.route("/evaluation/internshipCriteria").get(getCriterias("internship"));

router
  .route("/evaluation/seminarCriteria/:id")
  .delete(deleteCriteria("seminar"));
router
  .route("/evaluation/internshipCriteria/:id")
  .delete(deleteCriteria("internship"));

export default router;
