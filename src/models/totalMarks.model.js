import mongoose, { Schema } from "mongoose";

const totalMarksSchema = new Schema({
  marks: { type: Number, default: 100 },
  evalType: String,
  academicYear: String,
});

totalMarksSchema.pre("updateOne", async function (next) {
  try {
    const docToUpdate = await this.model.findOne(this.getQuery());

    // Check if the marks field is being modified
    if (this._update.$set && this._update.$set.marks) {
      // Clear referenced records from the EvaluationCriteria model
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
