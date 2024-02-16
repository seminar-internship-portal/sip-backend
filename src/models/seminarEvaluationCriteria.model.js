import mongoose, { Schema } from "mongoose";

const seminarEvaluationCriteriaSchema = new Schema({
  name: String,
  criteriaMarks: Number,
});

export const SeminarEvaluationCriteria = mongoose.model(
  "SeminarEvaluationCriteria",
  seminarEvaluationCriteriaSchema
);
