import mongoose, { Schema } from "mongoose";

const internshipSchema = new Schema(
  {
    companyName: {
      type: String,
    },
    offerLetter: {
      type: String,
    },
    permissionLetter: {
      type: String,
    },
    completionLetter: {
      type: String,
    },
    duration: {
      type: String,
    },
    status: {
      type: String,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "Student",
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
