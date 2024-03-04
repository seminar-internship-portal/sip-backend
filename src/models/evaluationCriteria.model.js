import mongoose, { Schema } from "mongoose";

const evaluationCriteriaSchema = new Schema({
  name: String,
  criteriaMarks: Number,
  evalType: String, // seminar or internship
  academicYear: String,
});

export const EvaluationCriteria = mongoose.model(
  "EvaluationCriteria",
  evaluationCriteriaSchema
);
