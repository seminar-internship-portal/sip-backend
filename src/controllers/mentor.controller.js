import { Mentor } from "../models/mentor.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Student } from "../models/student.model.js";
import { StudentEvaluation } from "../models/studentEvaluation.model.js";
import { SeminarEvaluationCriteria } from "../models/seminarEvaluationCriteria.model.js";
import { InternshipEvaluationCriteria } from "../models/internshipEvaluationCriteria.model.js";

const generateAccessAndRefreshTokens = async (mentorId) => {
  try {
    const mentor = await Mentor.findById(mentorId);
    const accessToken = mentor.generateAccessToken();
    const refreshToken = mentor.generateRefreshToken();

    mentor.refreshToken = refreshToken;
    console.log(mentor.refreshToken);
    await mentor.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (err) {
    throw new ApiError(
      500,
      "Something went wrong while generating access & refresh token"
    );
  }
};

const getAllMentors = asyncHandler(async (req, res) => {
  const mentors = await Mentor.find({});
  const mentorData = mentors.map((ment) => {
    return {
      id: ment._id,
      username: ment.username,
      email: ment.email,
      registrationId: ment.registrationId,
      fullName: ment.fullName,
      mobileNo: ment.mobileNo,
    };
  });
  res.status(200).json(new ApiResponse(200, mentorData));
});

const registerMentor = asyncHandler(async (req, res) => {
  const {
    username,
    email,
    fullName,
    registrationId,
    password,
    mobileNo,
    avatar,
  } = req.body;

  console.log(username);

  //valdiations
  if (
    [fullName, username, email, password, mobileNo, registrationId].some(
      (field) => !field || field.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existingMentor = await Mentor.findOne({
    $or: [{ username }, { email }, { registrationId }],
  });

  if (existingMentor) {
    throw new ApiError(409, "Mentor with email or username already exists");
  }

  const mentor = await Mentor.create({
    username: username.toLowerCase(),
    email,
    registrationId,
    fullName,
    password,
    mobileNo,
    avatar,
    roleType: "mentor",
  });

  const createdMentor = await Mentor.findById(mentor._id).select(
    "-password -refreshToken"
  );

  if (!createdMentor) {
    throw new ApiError(
      500,
      "Something went wrong while registering the mentor"
    );
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, createdMentor, "Mentor registered successfully")
    );
});

const loginMentor = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (!username && !email) {
    throw new ApiError(400, "username or email is required!");
  }

  const mentor = await Mentor.findOne({
    $or: [{ username }, { email }],
  });

  if (!mentor) {
    throw new ApiError(404, "Mentor does not exist");
  }

  const isPasswordValid = await mentor.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid Mentor Credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    mentor._id
  );
  // console.log(accessToken, refreshToken);
  const loggedInMentor = await Mentor.findById(mentor._id).select(
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
    .cookie("role_type", "mentor")
    .json(
      new ApiResponse(
        200,
        {
          mentor: loggedInMentor,
          accessToken,
          refreshToken,
        },
        "Mentor Logged-in Successfully"
      )
    );
});

const logoutMentor = asyncHandler(async (req, res) => {
  await Mentor.findByIdAndUpdate(
    req.mentor._id,
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
    .clearCookie("role_type")
    .json(200, new ApiResponse(200, {}, "Mentor Logged out Successfully!"));
});

const evaluateStudent = (evalType) => {
  return asyncHandler(async (req, res) => {
    const studId = req.params.studId;
    const marks = req.body;

    let evalCriteria;
    if (evalType === "seminar") {
      for (const mark of marks) {
        const criteriaId = mark.evaluationCriteria;
        evalCriteria = await SeminarEvaluationCriteria.findById(criteriaId);

        if (!evalCriteria) {
          throw new ApiError(404, "Evaluation criteria not found.");
        }
      }
    } else if (evalType === "internship") {
      for (const mark of marks) {
        const criteriaId = mark.evaluationCriteria;
        evalCriteria = await InternshipEvaluationCriteria.findById(criteriaId);

        if (!evalCriteria) {
          throw new ApiError(404, "Evaluation criteria not found.");
        }
      }
    }

    const student = await Student.findById(studId);

    if (!student) {
      throw new ApiError(404, "Student not found.");
    }

    const evaluatedStud = await StudentEvaluation.findOneAndUpdate(
      { studentId: studId, evalType },
      {
        studentId: studId,
        marksAssigned: marks,
      },
      { upsert: true, new: true }
    );

    res
      .status(200)
      .json(new ApiResponse(200, evaluatedStud, "Marks Assigned Successfully"));
  });
};

// individual mentor
const getIndividualMentor = asyncHandler(async (req, res) => {
  const idToFind = req.params?.uniqueId;
  const mentor = await Mentor.findById(idToFind).select(
    "-password -refreshToken"
  );

  if (!mentor) {
    throw new ApiError(401, "Mentor does not exist");
  }

  res
    .status(200)
    .json(new ApiResponse(200, mentor, "Successfully fetched the data"));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const mentor = await Mentor.findById(req.user?.id);
  const isPasswordCorrect = await mentor.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old Password");
  }

  mentor.password = newPassword;
  await mentor.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed Successfully!"));
});

export {
  getAllMentors,
  registerMentor,
  loginMentor,
  logoutMentor,
  evaluateStudent,
  getIndividualMentor,
  changeCurrentPassword,
};
