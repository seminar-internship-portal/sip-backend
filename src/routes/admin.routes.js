import { Router } from "express";
import {
  deleteCriteria,
  createCriteria,
  getCriterias,
} from "../controllers/admin.controller.js";

const router = Router();

router.route("/evaluation/seminarCriteria").post(createCriteria("seminar"));
router.route("/evaluation/seminarCriteria").get(getCriterias("seminar"));
router.route("/evaluation/internshipCriteria").post(createCriteria("internship"));
router.route("/evaluation/internshipCriteria").get(getCriterias("internship"));

router.route("/evaluation/:id").delete(deleteCriteria);

export default router;
