import mongoose, { Schema } from "mongoose";
import { TotalMarks } from "./totalMarks.model.js";
import { ApiError } from "../utils/ApiError.js";

const evaluationCriteriaSchema = new Schema({
  name: String,
  criteriaMarks: Number,
  evalType: String, // seminar or internship
  academicYear: String,
});

evaluationCriteriaSchema.pre("save", async function (next) {
  const Criteria = this.constructor;

  try {
    let totalMarksRecord = await TotalMarks.findOne({
      academicYear: this.academicYear,
      evalType: this.evalType,
    });

    if (!totalMarksRecord) {
      totalMarksRecord = new TotalMarks({
        academicYear: this.academicYear,
        evalType: this.evalType,
        marks: 100,
      });
      await totalMarksRecord.save();
    }

    const MAX_TOTAL_MARKS_LIMIT = totalMarksRecord.marks;

    const totalMarks = await Criteria.aggregate([
      {
        $match: {
          academicYear: this.academicYear,
          evalType: this.evalType,
        },
      },
      {
        $group: {
          _id: null,
          totalMarks: { $sum: "$criteriaMarks" },
        },
      },
    ]);

    const totalMarksForEvalType =
      totalMarks.length > 0 ? totalMarks[0].totalMarks : 0;

    if (totalMarksForEvalType + this.criteriaMarks > MAX_TOTAL_MARKS_LIMIT) {
      return next(
        new ApiError(400, "Adding this criteria exceeds the total marks limit.")
      );
    }

    next();
  } catch (error) {
    return next(new ApiError(error));
  }
});

export const EvaluationCriteria = mongoose.model(
  "EvaluationCriteria",
  evaluationCriteriaSchema
);
