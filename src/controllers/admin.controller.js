import { EvaluationCriteria } from "../models/evaluationCriteria.model.js";
import { InternshipEvaluationCriteria } from "../models/internshipEvaluationCriteria.model.js";
import { SeminarEvaluationCriteria } from "../models/seminarEvaluationCriteria.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getCriterias = (evalType) => {
  return asyncHandler(async (req, res) => {
    let criterias;

    if (evalType === "seminar") {
      criterias = await SeminarEvaluationCriteria.find({});
    } else if (evalType === "internship") {
      criterias = await InternshipEvaluationCriteria.find({});
    }

    let totalMarks = 0;
    criterias.forEach((criteria) => {
      totalMarks += criteria.criteriaMarks;
    });

    res.status(200).json(new ApiResponse(200, { criterias, totalMarks }));
  });
};

const createCriteria = (evalType) => {
  return asyncHandler(async (req, res) => {
    const { criteriaName, criteriaMarks } = req.body;

    if (!criteriaMarks || !criteriaMarks) {
      throw new ApiError(400, "Name or Marks not provided properly.");
    }

    let newCriteria;

    if (evalType === "seminar") {
      const existingCriteria = await SeminarEvaluationCriteria.find({
        name: criteriaName,
      });

      if (existingCriteria.length) {
        console.log(existingCriteria);
        throw new ApiError(409, "Criteria already exists");
      }

      newCriteria = await SeminarEvaluationCriteria.create({
        name: criteriaName,
        criteriaMarks,
      });
    } else if (evalType === "internship") {
      const existingCriteria = await InternshipEvaluationCriteria.find({
        name: criteriaName,
      });

      if (existingCriteria.length) {
        console.log(existingCriteria);
        throw new ApiError(409, "Criteria already exists");
      }

      newCriteria = await InternshipEvaluationCriteria.create({
        name: criteriaName,
        criteriaMarks,
      });
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          newCriteria,
          `${criteriaName} criteria with ${criteriaMarks} marks created!`
        )
      );
  });
};

// yet to be implemented
const deleteCriteria = asyncHandler(async (req, res) => {
  const criteriaId = req.params.id;
  const criteria = await EvaluationCriteria.findById(criteriaId);

  if (!criteria) {
    throw new ApiError(404, "Criteria doesn't exists.");
  }

  await EvaluationCriteria.findOneAndDelete(criteria);

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Criteria deleted successfully"));
});

const getCriteriaInfo = asyncHandler(async (criteriaId) => {
  const res = await EvaluationCriteria.findById(criteriaId);

  return res;
});

export { deleteCriteria, getCriterias, createCriteria };
