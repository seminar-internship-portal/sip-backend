import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const studentSchema = new Schema(
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
    academicYear: {
      type: String,
    },
    avatar: {
      type: String, //cloudinary URL
    },
    mobileNo: {
      type: String,
      required: true,
    },
    rollNo: {
      type: String,
      required: true,
      index: true,
    },
    prnNo: {
      type: String,
      required: true,
    },
    registrationId: {
      type: String,
      required: true,
      index: true,
    },
    roleType: {
      type: String,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
    SeminarInfo: {
      type: Schema.Types.ObjectId,
      ref: "SeminarInfo", //! check in future
    },
    internshipInfo: {
      type: Schema.Types.ObjectId,
      ref: "InternshipInfo",
    },
  },
  {
    timestamps: true,
  }
);

//before saving hash the password
studentSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10); //10 is salt
  next();
});

studentSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

studentSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
      roleType: this.roleType,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

studentSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      roleType: this.roleType,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const Student = mongoose.model("Student", studentSchema);
