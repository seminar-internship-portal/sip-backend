import mongoose, { Schema } from "mongoose";

const internshipFilesSchema = new Schema(
  {},
  {
    timestamps: true,
  }
);

export const InternshipFiles = mongoose.model(
  "InternshipFiles",
  internshipFilesSchema
);
