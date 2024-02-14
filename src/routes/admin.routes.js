import { Router } from "express";
import {
  createCriteria,
  getAllCriterias,
  deleteCriteria,
} from "../controllers/admin.controller.js";

const router = Router();

router.route("/evaluation").post(createCriteria);
router.route("/evaluation").get(getAllCriterias);

router.route("/evaluation/:id").delete(deleteCriteria);

export default router;
