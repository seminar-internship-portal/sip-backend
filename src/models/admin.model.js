import mongoose, { Schema } from "mongoose";

const adminSchema = new Schema(
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
    avatar: {
      type: String, //cloudinary URL
      required: true,
    },
    // roleType: {

    // },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
    mentors: [
      {
        type: Schema.Types.ObjectId,
        ref: "Mentor",
      },
    ],
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: "Student", //! check this once in future.
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Admin = mongoose.model("Admin", adminSchema);
