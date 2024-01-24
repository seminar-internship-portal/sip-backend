import mongoose, { Schema } from "mongoose";

const mentorSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    avatar: {
      type: String, //cloudinary URL
      required: true,
    },
    // roleType: {

    // },
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: "Student", //! check this once in future.
      },
    ],
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Mentor = mongoose.model("Mentor", mentorSchema);
