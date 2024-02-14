import { EvaluationCriteria } from "../models/evaluationCriteria.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createCriteria = asyncHandler(async (req, res) => {
  const { criteriaName, criteriaMarks } = req.body;

  const existingCriteria = await EvaluationCriteria.find({
    name: criteriaName,
  });

  if (existingCriteria.length) {
    console.log(existingCriteria);
    throw new ApiError(409, "Criteria already exists");
  }

  const newCriteria = await EvaluationCriteria.create({
    name: criteriaName,
    criteriaMarks,
  });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        newCriteria,
        `${criteriaName} criteria with ${criteriaMarks} created!`
      )
    );
});

const getAllCriterias = asyncHandler(async (req, res) => {
  const criterias = await EvaluationCriteria.find({});
  let totalMarks = 0;
  criterias.forEach((criteria) => {
    totalMarks += criteria.criteriaMarks;
  });

  res.status(200).json(new ApiResponse(200, { criterias, totalMarks }));
});

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

export { createCriteria, getAllCriterias, deleteCriteria };
