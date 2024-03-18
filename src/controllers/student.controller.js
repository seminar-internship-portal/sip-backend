import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Student } from "../models/student.model.js";
import { StudentEvaluation } from "../models/studentEvaluation.model.js";
import { EvaluationCriteria } from "../models/evaluationCriteria.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { SeminarInfo } from "../models/seminarFiles.model.js";
import { InternshipInfo } from "../models/internshipFiles.model.js";

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

  const studentsQuery = Student.find({});
  if (year) studentsQuery.where({ academicYear: year });
  const students = await studentsQuery.exec();

  const studentData = students.map(async (stud) => {
    const { _id, password, createdAt, updatedAt, refreshToken, ...rest } =
      stud.toObject();

    const seminarTopic = await SeminarInfo.findOne({
      owner: _id,
    }).select("title -_id");

    const internships = await InternshipInfo.find({
      owner: _id,
    }).select("companyName status");

    return {
      id: _id,
      ...rest,
      seminarTopic: seminarTopic ? seminarTopic.title : null,
      internships,
    };
  });

  res.status(200).json(new ApiResponse(200, await Promise.all(studentData)));
});

const getAllInfo = (evalType) => {
  return asyncHandler(async (req, res) => {
    const academicYear = req.query?.academicYear;

    const model = evalType == "seminar" ? SeminarInfo : InternshipInfo;

    let allDetails = await model.find({}).populate({
      path: "owner",
      select: "fullName rollNo registraionId academicYear",
    });

    allDetails = allDetails
      .filter((ele) => {
        if (!academicYear && ele.owner !== null) return true;
        return ele.owner !== null && ele.owner.academicYear === academicYear;
      })
      .map((ele) => {
        const { createdAt, updatedAt, owner, ...rest } = ele.toObject();
        return {
          fullName: owner.fullName,
          rollNo: owner.rollNo,
          registration: owner.registrationId,
          ...rest,
        };
      });

    res.status(200).json(new ApiResponse(200, allDetails));
  });
};

const getStudentDetails = (evalType) =>
  asyncHandler(async (req, res) => {
    const model = evalType == "seminar" ? SeminarInfo : InternshipInfo;
    const studDetails = await model.find({
      owner: req.params.studId,
    });
    res.status(200).json(new ApiResponse(200, studDetails));
  });

const updateStudentDetails = (evalType) => {
  return asyncHandler(async (req, res) => {
    const studId = req.params?.studId;
    const data = req.body;
    const stud = await Student.findById(studId);
    if (!stud) throw new ApiError(404, "Student not found");
    let resData;

    if (evalType == "seminar") {
      resData = await SeminarInfo.findOneAndUpdate(
        {
          owner: studId,
        },
        { $set: { ...data } },
        {
          returnOriginal: false,
        }
      );
    } else {
      const internshipId = req.params?.internshipId;
      resData = await InternshipInfo.findOneAndUpdate(
        {
          owner: studId,
          _id: internshipId,
        },
        { $set: { ...data } },
        { returnOriginal: false }
      );
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, resData, `${evalType} data updated successfully`)
      );
  });
};

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

    .json(new ApiResponse(200, {}, "Student Logged out Successfully!"));
});

const getStudentMarks = (evalType) => {
  return asyncHandler(async (req, res) => {
    const studId = req.params.studId;
    const student = await Student.findById(studId);

    if (!student) {
      throw new ApiError(404, "Student not found.");
    }

    const academicYear = student.academicYear;
    const allCriteria = await EvaluationCriteria.find({
      evalType,
      academicYear,
    });

    for (const criteria of allCriteria) {
      const studCriteriaEval = await StudentEvaluation.findOne({
        studentId: studId,
        evaluationCriteria: criteria._id,
        evalType,
      });

      if (!studCriteriaEval)
        await StudentEvaluation.create({
          studentId: studId,
          evaluationCriteria: criteria._id,
          evalType,
        });
    }

    const studAllMarks = await StudentEvaluation.find({
      studentId: studId,
      evalType,
    });

    const studAllMarksWithCriteria = await getCriteriaInfo(studAllMarks);
    res.status(200).json(new ApiResponse(200, studAllMarksWithCriteria));
  });
};

const getCriteriaInfo = async (studAllMarks) => {
  let studMarksWithCriteria = [];

  for (const studCriteriaMark of studAllMarks) {
    const { evaluationCriteria, evalType, marks } = studCriteriaMark;

    const criteria = await EvaluationCriteria.findOne({
      _id: evaluationCriteria,
      evalType,
    });

    const criteriaName = criteria.name;
    studMarksWithCriteria.push({
      criteriaId: evaluationCriteria,
      criteriaName,
      criteriaTotalMarks: criteria.criteriaMarks,
      studCriteriaMarks: marks,
    });
  }

  return studMarksWithCriteria;
};

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

const updateStudentAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar File is missing!");
  }

  //TODO: delete the old avatar from cloudinary!

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }

  const student = await Student.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(
      new ApiResponse(200, student, "Student's Avatar Uploaded Succesfully!")
    );
});

const addSeminarDetails = asyncHandler(async (req, res) => {
  const { title, id } = req.body;
  if (!title.trim() === "") {
    throw new ApiError(400, "Title is Required!");
  }

  const existingDoc = await SeminarInfo.find({
    owner: id,
  });
  if (existingDoc)
    throw new ApiError(
      400,
      "Seminar Info already added.. pls update existing info"
    );

  const doc = await SeminarInfo.create({
    title,
    owner: id,
  });

  const createdDoc = await SeminarInfo.findById(doc._id);
  if (!createdDoc) {
    throw new ApiError(
      500,
      "Something went wrong while adding seminar details!"
    );
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, createdDoc, "Seminar details added succesfully!")
    );
});

const addInternshipDetails = asyncHandler(async (req, res) => {
  const { companyName, duration, status, id } = req.body;
  if (!companyName?.trim() || !duration?.trim() || !status || !id) {
    throw new ApiError(400, "All fields are necessary!");
  }

  const doc = await InternshipInfo.create({
    companyName,
    duration,
    status,
    owner: id,
  });

  const createdDoc = await InternshipInfo.findById(doc._id);
  if (!createdDoc) {
    throw new ApiError(
      500,
      "Something went wrong while adding internship details!"
    );
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, createdDoc, "Internship details added succesfully!")
    );
});

export {
  getAllStudents as getData,
  getAllInfo,
  loginStudent,
  logoutStudent,
  getIndividualStudent,
  getStudentDetails,
  updateStudentDetails,
  getStudentMarks,
  changeCurrentPassword,
  updateAccountDetails,
  updateStudentAvatar,
  addSeminarDetails,
  addInternshipDetails,
};
