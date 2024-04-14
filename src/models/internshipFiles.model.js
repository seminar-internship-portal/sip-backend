import mongoose, { Schema } from "mongoose";

const internshipSchema = new Schema(
  {
    companyName: {
      type: String,
    },
    startDate: Date,
    endDate: Date,
    stipend: {
      type: Number,
      default: 0,
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
    deadline: {
      type: Date,
      default: null,
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
