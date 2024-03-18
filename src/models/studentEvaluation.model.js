import mongoose, { Schema } from "mongoose";

const studentEvaluation = new Schema({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: "Student",
  },
  evalType: String,
  evaluationCriteria: {
    type: Schema.Types.ObjectId,
    ref: "EvaluationCriteria",
  },
  marks: {
    type: Number,
    default: 0,
  },
});

export const StudentEvaluation = mongoose.model(
  "StudentEvaluation",
  studentEvaluation
);
