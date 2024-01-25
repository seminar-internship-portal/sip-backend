import mongoose, { Schema } from "mongoose";

const internshipSchema = new Schema(
  {
    companyName: {
      type: String,
    },
    noc: {
      type: String,
    },
    offerLetter: {
      type: String,
    },
    completionLetter: {
      type: String,
    },
    status: {
      type: String,
    },
    marks: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

export const InternshipInfo = mongoose.model(
  "InternshipInfo",
  internshipSchema
);
