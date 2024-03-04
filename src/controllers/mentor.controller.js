import { Mentor } from "../models/mentor.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Student } from "../models/student.model.js";
import { StudentEvaluation } from "../models/studentEvaluation.model.js";
import { EvaluationCriteria } from "../models/evaluationCriteria.model.js";

const generateAccessAndRefreshTokens = async (mentorId) => {
  try {
    const mentor = await Mentor.findById(mentorId);
    const accessToken = mentor.generateAccessToken();
    const refreshToken = mentor.generateRefreshToken();

    mentor.refreshToken = refreshToken;
    // console.log(mentor.refreshToken);
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
    req.user._id,
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
    const marksArr = req.body;

    const stud = await Student.findById(studId);
    if (!stud) {
      throw new ApiError(404, "Student not found");
    }

    const academicYear = stud.academicYear;

    for (const criteria of marksArr) {
      const evalCriteria = await EvaluationCriteria.findOne({
        _id: criteria.evaluationCriteria,
        academicYear,
        evalType,
      });

      if (!evalCriteria)
        throw new ApiError(
          404,
          "Some criteria doesn't exist. Ensure criteria are correct."
        );

      if (criteria.marks > evalCriteria.criteriaMarks) {
        throw new ApiError(
          400,
          `${evalCriteria.name} can have maximum marks of ${evalCriteria.criteriaMarks}`
        );
      }

      const studEval = await StudentEvaluation.findOneAndUpdate(
        {
          studentId: studId,
          evaluationCriteria: criteria.evaluationCriteria,
          evalType,
        },
        {
          marks: criteria.marks,
        },
        {
          upsert: true,
          new: true,
        }
      );
    }

    res
      .status(200)
      .json(new ApiResponse(200, {}, "Student marks updated successfully"));
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

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email, avatar, mobileNo } = req.body;

  if (!fullName && !email) {
    throw new ApiError(400, "Either FullName or Email are required");
  }

  const updateFields = {
    fullName,
    ...(email && { email }),
    ...(avatar && { avatar }),
    ...(mobileNo && { mobileNo }),
  };

  const oldment = await Mentor.findById(req.user?._id);
  if (oldment.email != email)
    throw new ApiError(401, "Unauthorized to update data");

  const ment = await Mentor.findByIdAndUpdate(
    req.user?._id,
    {
      $set: updateFields,
    },
    {
      new: true,
    }
  ).select("-password");

  if (!ment) {
    throw new ApiError(402, "Mentor does not exist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, ment, "Account Details changed successfully!"));
});

export {
  getAllMentors,
  loginMentor,
  logoutMentor,
  evaluateStudent,
  getIndividualMentor,
  changeCurrentPassword,
  updateAccountDetails,
};
