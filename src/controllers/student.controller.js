import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Student } from "../models/student.model.js";

const generateAccessAndRefreshTokens = async (studentId) => {
  try {
    const student = await Student.findById(studentId);
    const accessToken = student.generateAccessToken();
    const refreshToken = student.generateRefreshToken();

    student.refreshToken = refreshToken; //db mai dalenge na
    await student.save({ validateBeforeSave: false }); //save in db w/o validating or else password will be replaced

    return { accessToken, refreshToken };
  } catch (err) {
    throw new ApiError(
      500,
      "Something went wrong while generating access & refresh token"
    );
  }
};

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

  //valdiations
  if (
    [
      fullName,
      username,
      email,
      password,
      prnNo,
      mobileNo,
      rollNo,
      registrationId,
    ].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existingStudent = await Student.findOne({
    $or: [{ username }, { email }, { prnNo }, { registrationId }],
  });

  if (existingStudent) {
    throw new ApiError(409, "Student with email or username already exists");
  }

  const stud = await Student.create({
    username: username,
    email,
    fullName,
    avatar,
    mobileNo,
    rollNo,
    prnNo,
    registrationId,
    password,
  });

  const createdStud = await Student.findById(stud._id).select(
    "-password -refreshToken"
  );

  if (!createdStud) {
    throw new ApiError(
      500,
      "Something went wrong while registering the student"
    );
  }

  res
    .status(200)
    .json(new ApiResponse(200, createdStud, "Student registered Successfully"));
});

const loginStudent = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (!username && !email) {
    throw new ApiError(400, "username or email is required!");
  }

  const student = await Student.findOne({
    $or: [{ username }, { email }],
  });

  if (!student) {
    throw new ApiError(404, "Student does not exist");
  }

  const isPasswordValid = await student.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid Student Credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    student._id
  );

  const loggedInStudent = await Student.findById(student._id).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          student: loggedInStudent,
          accessToken,
          refreshToken,
        },
        "Student Logged-in Successfully"
      )
    );
});

export { getAllStudents as getData, registerStudent, loginStudent };
