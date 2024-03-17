import mongoose, { Schema } from "mongoose";

const seminarSchema = new Schema(
  {
    title: {
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
    researchPapers: [
      {
        type: String,
      },
    ],
    owner: {
      type: Schema.Types.ObjectId,
      ref: "Student",
    },
  },
  {
    timestamps: true,
  }
);

export const SeminarInfo = mongoose.model("SeminarInfo", seminarSchema);
