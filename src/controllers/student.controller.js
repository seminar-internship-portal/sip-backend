import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Student } from "../models/student.model.js";
import { StudentEvaluation } from "../models/studentEvaluation.model.js";
import { SeminarEvaluationCriteria } from "../models/seminarEvaluationCriteria.model.js";
import { InternshipEvaluationCriteria } from "../models/internshipEvaluationCriteria.model.js";

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
  const year = req.query.year;

  let students;
  if (!year) {
    students = await Student.find({});
  } else {
    students = await Student.find({
      academicYear: year,
    });
  }

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

const getIndividualStudent = asyncHandler(async (req, res) => {
  const idToFind = req.params?.uniqueId;
  const student = await Student.findById(idToFind).select(
    "-password -refreshToken"
  );

  if (!student) {
    throw new ApiError(401, "Student does not exist");
  }

  res
    .status(200)
    .json(new ApiResponse(200, student, "Successfully fetched the data"));
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
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .cookie("role_type", "student")
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
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true, // return the updated document
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

    .json(200, new ApiResponse(200, {}, "Student Logged out Successfully!"));
});

const getStudentMarks = (evalType) => {
  return asyncHandler(async (req, res) => {
    const studId = req.params.studId;
    const student = await Student.findById(studId);

    if (!student) {
      throw new ApiError(404, "Student not found.");
    }

    let stud = await StudentEvaluation.findOne({
      studentId: studId,
      evalType,
    });

    // if student evaluation not done yet then assign 0 marks
    if (!stud) {
      if (evalType === "seminar") {
        const evalCriterias = await SeminarEvaluationCriteria.find({});
        const marksAssigned = evalCriterias.map((criteria) => {
          return { evaluationCriteria: criteria._id, marks: 0 };
        });

        await StudentEvaluation.findOneAndUpdate(
          { studentId: studId, evalType },
          {
            studentId: studId,
            marksAssigned,
          },
          { upsert: true, new: true }
        );
      } else if (evalType === "internship") {
        const evalCriterias = await InternshipEvaluationCriteria.find({});
        const marksAssigned = evalCriterias.map((criteria) => {
          return { evaluationCriteria: criteria._id, marks: 0 };
        });

        await StudentEvaluation.findOneAndUpdate(
          { studentId: studId, evalType },
          {
            studentId: studId,
            marksAssigned,
          },
          { upsert: true, new: true }
        );
      }
    }

    stud = await StudentEvaluation.findOne({
      studentId: studId,
      evalType,
    });

    const studMarks = stud.marksAssigned;
    const studMarksWithCriteriaInfo = await getCriteriaInfo(
      evalType,
      studMarks
    );

    res.status(200).json(new ApiResponse(200, studMarksWithCriteriaInfo));
  });
};

async function getCriteriaInfo(evalType, criteriasMarks) {
  const criteriaInfoPromises = criteriasMarks.map(async (criteria) => {
    const id = criteria.evaluationCriteria;
    let criteriaDetails;

    if (evalType === "seminar") {
      criteriaDetails = await SeminarEvaluationCriteria.findById(id);
    } else {
      criteriaDetails = await InternshipEvaluationCriteria.findById(id);
    }

    return {
      criteriaId: id,
      criteriaName: criteriaDetails.name,
      studCriteriaMarks: criteria.marks,
      criteriaTotalMarks: criteriaDetails.criteriaMarks,
    };
  });

  const criteriaInfo = await Promise.all(criteriaInfoPromises);
  return criteriaInfo;
}
// ---------------------------------------------------------------------------------------

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email, avatar, mobileNo } = req.body;

  if (!fullName && !email) {
    throw new ApiError(401, "Either FullName or Email are required");
  }

  const updateFields = {
    fullName,
    ...(email && { email }),
    ...(avatar && { avatar }),
    ...(mobileNo && { mobileNo }),
  };

  const oldStud = await Student.findById(req.user?._id);
  if (oldStud.email != email)
    throw new ApiError(401, "Unauthorized to update data");

  const student = await Student.findByIdAndUpdate(
    req.user?._id,
    {
      $set: updateFields,
    },
    {
      new: true,
    }
  ).select("-password");

  if (!student) {
    throw new ApiError(402, "Student does not exist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, student, "Account Details changed successfully!")
    );
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const stud = await Student.findById(req.user?.id);
  const isPasswordCorrect = await stud.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old Password");
  }

  stud.password = newPassword;
  await stud.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed Successfully!"));
});

export {
  getAllStudents as getData,
  loginStudent,
  logoutStudent,
  getIndividualStudent,
  getStudentMarks,
  changeCurrentPassword,
  updateAccountDetails,
};
