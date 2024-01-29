import { asyncHandler } from "../utils/asyncHandler.js";
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
      id: stud._id,
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
    username: username.toLowerCase(),
    email,
    fullName,
    avatar,
    mobileNo,
    rollNo,
    prnNo,
    registrationId,
    password,
    roleType: "student",
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

const logoutStudent = asyncHandler(async (req, res) => {
  await Student.findByIdAndUpdate(
    req.student._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true, // after return ull get new value of data not old
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(200, new ApiResponse(200, {}, "Student Logged out Successfully!"));
});

/*

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken;
  //req.body wala is for mobile devices
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized  request!");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    //now incoming wala verify it with db wala
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired!");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { rt, at } = await generateAccessAndRefreshTokens(user._id);
    return res
      .status(200)
      .cookie("accessToken", at, options)
      .cookie("refreshToken", rt, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: rt },
          "Access Token Refreshed!"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  //is password changing so logged in -> and we have written auth.middleware req.user = user
  const user = await User.findById(req.user?.id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old Password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false }); //before save pre wala hook will run & hash the pass

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed Successfully!"));
});

*/

export {
  getAllStudents as getData,
  registerStudent,
  loginStudent,
  logoutStudent,
};
