import mongoose, { Schema } from "mongoose";

const seminarSchema = new Schema(
  {
    topicName: {
      type: String,
    },
    ppt: {
      type: String,
    },
    abstract: {
      type: String,
    },
    report: {
      type: String,
    },
    literatureSurvey: {
      type: String,
    },
    researchPapers: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const SeminarInfo = mongoose.model("SeminarInfo", seminarSchema);
