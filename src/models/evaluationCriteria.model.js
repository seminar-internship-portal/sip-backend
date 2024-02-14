import mongoose, { Schema } from "mongoose";

const evaluationCriteriaSchema = new Schema(
  {
    name: String,
    criteriaMarks: Number,
  },
  { timestamps: true }
);

export const EvaluationCriteria = mongoose.model(
  "EvaluationCriteria",
  evaluationCriteriaSchema
);
