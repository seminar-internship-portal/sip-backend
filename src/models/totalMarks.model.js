import mongoose, { Schema } from "mongoose";
import { EvaluationCriteria } from "./evaluationCriteria.model.js";
import { StudentEvaluation } from "./studentEvaluation.model.js";

const totalMarksSchema = new Schema({
  marks: { type: Number, default: 100 },
  evalType: String,
  academicYear: String,
});

totalMarksSchema.pre("findOneAndUpdate", async function (next) {
  try {
    const docToUpdate = await this.model.findOne(this.getQuery());

    // Check if the marks field is being modified
    if (this._update.marks && docToUpdate.marks !== this._update.marks) {
      // clear from student evaluation
      const currCriterias = await EvaluationCriteria.find({
        academicYear: docToUpdate.academicYear,
        evalType: docToUpdate.evalType,
      });

      for (const criteria of currCriterias) {
        await StudentEvaluation.deleteMany({
          evaluationCriteria: criteria._id,
        });
      }

      // clear referenced records from the EvaluationCriteria model
      await EvaluationCriteria.deleteMany({
        academicYear: docToUpdate.academicYear,
        evalType: docToUpdate.evalType,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
});

export const TotalMarks = mongoose.model("TotalMarks", totalMarksSchema);
