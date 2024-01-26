import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

const mentorSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    registrationId: {
      type: String,
      required: true,
      unique: true,
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

mentorSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10); //10 is salt
  next();
});

mentorSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

export const Mentor = mongoose.model("Mentor", mentorSchema);
