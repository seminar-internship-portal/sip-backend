import mongoose, { Schema } from "mongoose";

const internshipEvaluationCriteriaSchema = new Schema({
  name: String,
  criteriaMarks: Number,
});

export const InternshipEvaluationCriteria = mongoose.model(
  "InternshipEvaluationCriteria",
  internshipEvaluationCriteriaSchema
);
