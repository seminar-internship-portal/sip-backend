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
      url: {
        type: String,
      },
      publicId: {
        type: String,
      },
    },
    permissionLetter: {
      url: {
        type: String,
      },
      publicId: {
        type: String,
      },
    },
    completionLetter: {
      url: {
        type: String,
      },
      publicId: {
        type: String,
      },
    },
    fileMatchResults: {
      type: {
        offerLetter: {
          matchScore: Number,
          matchPhrase: String,
        },
      },
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
