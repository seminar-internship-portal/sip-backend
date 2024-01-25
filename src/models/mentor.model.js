import mongoose, { Schema } from "mongoose";

const mentorSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
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
    mobileNo: {
      type: String,
      required: true,
    },
    avatar: {
      type: String, //cloudinary URL
      // required: true,
    },
    roleType: {
      type: String,
      // required: true,
    },
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
