import mongoose, { Schema } from "mongoose";

const seminarFilesSchema = new Schema(
  {},
  {
    timestamps: true,
  }
);

export const SeminarFiles = mongoose.model("SeminarFiles", seminarFilesSchema);
