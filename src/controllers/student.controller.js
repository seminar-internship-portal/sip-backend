import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Student } from "../models/student.model.js";

const getAllStudents = asyncHandler(async (req, res) => {
  const students = await Student.find({});
  const studentData = students.map((stud) => {
    return {
      username: stud.username,
      email: stud.email,
      fullName: stud.fullName,
      mobileNo: stud.mobileNo,
      rollNo: stud.rollNo,
      prnNo: stud.prnNo,
      registrationId: stud.registrationId,
    };
  });
  res.status(200).json(new ApiResponse(200, studentData));
});

const registerStudent = asyncHandler(async (req, res) => {
  const {
    username,
    email,
    fullName,
    avatar,
    mobileNo,
    rollNo,
    prnNo,
    registrationId,
    password,
  } = req.body;

  const existingStudent = await Student.findOne({
    $or: [{ username }, { email }, { prnNo }, { registrationId }],
  });

  if (existingStudent) {
    throw new ApiError(409, "Student with email or username already exists");
  }

  const stud = await Student.create({
    username: username.toLowerCase(),
    email,
    fullName,
    avatar,
    mobileNo,
    rollNo,
    prnNo,
    registrationId,
    password,
  });

  if (!stud) {
    throw new ApiError(
      500,
      "Something went wrong while registering the student"
    );
  }

  res
    .status(200)
    .json(new ApiResponse(200, stud, "Student registered Successfully"));
});

export { getAllStudents as getData, registerStudent };
