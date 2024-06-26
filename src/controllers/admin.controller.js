import { EvaluationCriteria } from "../models/evaluationCriteria.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Mentor } from "../models/mentor.model.js";
import { Student } from "../models/student.model.js";
import { Admin } from "../models/admin.model.js";
import nodemailer from "nodemailer";
import { StudentEvaluation } from "../models/studentEvaluation.model.js";
import { InternshipInfo } from "../models/internshipFiles.model.js";
import { SeminarInfo } from "../models/seminarFiles.model.js";
import { TotalMarks } from "../models/totalMarks.model.js";

const transporter = nodemailer.createTransport({
  service: "Gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: `${process.env.EMAIL}`,
    pass: `${process.env.EMAIL_PASSWORD}`,
  },
});

const sendEmail = async (toEmail, username, password) => {
  try {
    const mailOptions = {
      from: "Internship Co-ordinator PICT, Pune",
      to: toEmail,
      subject: "Your Account Credentials for Internship & Seminar Portal",
      text: `Your username: ${username}\nYour temporary password: ${password}\nPlease login to ur account and reset the password..\n\nInternship Co-ordinator PICT, Pune`,
    };
    await transporter
      .sendMail(mailOptions)
      .then(() => {
        console.log("Email Sent Successfully!");
      })
      .catch((err) => {
        console.log("failed to send email", err);
        throw new ApiError(501, "Failed to send Email!");
      });
  } catch (err) {
    throw new ApiError(501, "Failed to send Email!");
  }
};

const generateAccessAndRefreshTokens = async (adminId) => {
  try {
    const admin = await Admin.findById(adminId);
    const accessToken = admin.generateAccessToken();
    const refreshToken = admin.generateRefreshToken();

    admin.refreshToken = refreshToken;
    // console.log(mentor.refreshToken);
    await admin.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (err) {
    throw new ApiError(
      500,
      "Something went wrong while generating access & refresh token "
    );
  }
};

const loginAdmin = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (!username && !email) {
    throw new ApiError(400, "username or email is required!");
  }

  const admin = await Admin.findOne({
    $or: [{ username }, { email }],
  });

  if (!admin) {
    throw new ApiError(404, "Mentor doesnt exist");
  }

  const isPasswordValid = await admin.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid Password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    admin._id
  );

  const loggedInAdmin = await Admin.findById(admin._id).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .cookie("role_type", "admin")
    .json(
      new ApiResponse(
        200,
        {
          admin: loggedInAdmin,
          accessToken,
          refreshToken,
        },
        "Admin Logged-in Successfully"
      )
    );
});

const registerAdmin = asyncHandler(async (req, res) => {
  const {
    username,
    email,
    fullName,
    registrationId,
    password,
    mobileNo,
    avatar,
  } = req.body;

  //valdiations
  if (
    [fullName, username, email, password, mobileNo, registrationId].some(
      (field) => !field || field.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existingAdmin = await Admin.findOne({
    $or: [{ username }, { email }, { registrationId }],
  });

  if (existingAdmin) {
    throw new ApiError(409, "Admin with email or username already exists");
  }

  const admin = await Admin.create({
    username: username.toLowerCase(),
    email,
    registrationId,
    fullName,
    password,
    mobileNo,
    avatar,
    roleType: "admin",
  });

  const createdAdmin = await Admin.findById(admin._id).select(
    "-password -refreshToken"
  );

  if (!createdAdmin) {
    throw new ApiError(500, "Something went wrong while registering the admin");
  }

  res
    .status(200)
    .json(new ApiResponse(200, createdAdmin, "Admin registered successfully"));
});

const logoutAdmin = asyncHandler(async (req, res) => {
  await Admin.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
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
    .json(new ApiResponse(200, {}, "Admin Logged out Successfully!"));
});

const registerMentor = asyncHandler(async (req, res) => {
  const { username, email, fullName, registrationId, mobileNo, avatar } =
    req.body;

  //valdiations
  if (
    [fullName, username, email, mobileNo, registrationId].some(
      (field) => !field || field.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required to create new mentor");
  }

  const existingMentor = await Mentor.findOne({
    $or: [{ username }, { email }, { registrationId }],
  });

  if (existingMentor) {
    throw new ApiError(409, "Mentor with email or username already exists");
  }

  const password = process.env.TEMP_PASSWORD;
  // await sendEmail(email, username, password); //*test

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

  await sendEmail(email, username, password); //?final wala

  const createdMentor = await Mentor.findById(mentor._id);
  if (!createdMentor) {
    throw new ApiError(
      500,
      "Something went wrong while registering the mentor"
    );
  }

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Mentor registered successfully"));
});

const deleteMentor = asyncHandler(async (req, res) => {
  const mentorId = req.params.mentorId;
  await Mentor.deleteOne({
    _id: mentorId,
  });

  res.status(200).json(new ApiResponse(200, {}, "Mentor deleted successfully"));
});

const registerStudent = asyncHandler(async (req, res) => {
  const {
    username,
    email,
    fullName,
    academicYear,
    avatar,
    mobileNo,
    rollNo,
    prnNo,
    registrationId,
  } = req.body;

  const password = process.env.TEMP_PASSWORD;
  //valdiations
  if (
    [
      fullName,
      academicYear,
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
    academicYear,
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

  sendEmail(email, username, password);

  res
    .status(200)
    .json(new ApiResponse(200, createdStud, "Student registered Successfully"));
});

const deleteStudent = asyncHandler(async (req, res) => {
  const studId = req.params.studId;
  await Student.deleteOne({
    _id: studId,
  });

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Student deleted successfully"));
});

const assignMentor = asyncHandler(async (req, res) => {
  const { mentorId, studentId } = req.body;

  if (!mentorId && !studentId) {
    throw new ApiError(400, "Mentor ID and Student ID are required!");
  }

  const student = await Student.findById(studentId);
  if (!student) {
    throw new ApiError(404, "Student not Found");
  }

  if (student.mentorAssigned) {
    throw new ApiError(400, "Student already has mentor Assigned!");
  }

  const mentor = await Mentor.findById(mentorId);
  if (!mentor) {
    throw new ApiError(404, "Mentor not found");
  }

  student.mentorAssigned = mentorId;
  await student.save(); //! may hash the password again check in future

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Mentor Assigned Successfully!"));
});

const removeMentor = asyncHandler(async (req, res) => {
  const { studentId } = req.body;

  if (!studentId) {
    throw new ApiError(400, "Stduent Id is required");
  }

  const student = await Student.findById(studentId);
  if (!student) {
    throw new ApiError(404, "Student does not exist");
  }

  if (!student.mentorAssigned) {
    throw new ApiError(400, "Mentor must be assigned before removing");
  }

  student.mentorAssigned = null;
  student.save();

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Mentor removed Successfully!"));
});

const updateTotalMarks = asyncHandler(async (req, res) => {
  let { academicYear, evalType, marks } = req.body;
  if (!marks) marks = 100;

  let totalMarks = await TotalMarks.findOneAndUpdate(
    { academicYear, evalType },
    { marks },
    { new: true, upsert: true }
  );

  res
    .status(200)
    .json(new ApiResponse(200, totalMarks, "Total marks updated successfully"));
});

const getCriterias = (evalType) => {
  return asyncHandler(async (req, res) => {
    const academicYear = req.query.academicYear
      ? req.query.academicYear
      : "2023-2024";

    const criterias = await EvaluationCriteria.find({ evalType, academicYear });

    let totalMarks = 0;
    criterias.forEach((criteria) => {
      totalMarks += criteria.criteriaMarks;
    });

    let totalMaxMarks = await TotalMarks.findOne({ evalType, academicYear });
    if (!totalMaxMarks) {
      totalMaxMarks = await TotalMarks.create({ evalType, academicYear });
    }

    res.status(200).json(
      new ApiResponse(200, {
        criterias,
        totalMarks,
        totalMaxMarks: totalMaxMarks.marks,
      })
    );
  });
};

const createCriteria = (evalType) => {
  return asyncHandler(async (req, res) => {
    const { criteriaName, criteriaMarks } = req.body;
    const academicYear = req.body.academicYear
      ? req.body.academicYear
      : "2023-2024";

    if (!criteriaMarks || !criteriaMarks) {
      throw new ApiError(400, "Name or Marks not provided properly.");
    }

    const criteria = {
      name: criteriaName,
      criteriaMarks,
      evalType,
      academicYear,
    };

    const existingCriteria = await EvaluationCriteria.find({
      name: criteriaName,
      evalType,
      academicYear,
    });

    if (existingCriteria.length)
      throw new ApiError(403, `${criteriaName} already exists!`);

    const newCriteria = await EvaluationCriteria.create(criteria);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          newCriteria,
          `${criteriaName} criteria with ${criteriaMarks} marks created!`
        )
      );
  });
};

const deleteCriteria = (evalType) =>
  asyncHandler(async (req, res) => {
    const criteriaId = req.params.id;
    const criteria = await EvaluationCriteria.find({
      _id: criteriaId,
      evalType,
    });

    if (!criteria) {
      throw new ApiError(404, "Criteria doesn't exists.");
    }

    await EvaluationCriteria.findByIdAndDelete(criteriaId);

    // delete student evaluations for that deleted
    await StudentEvaluation.deleteMany({
      evaluationCriteria: criteriaId,
      evalType,
    });

    res
      .status(200)
      .json(new ApiResponse(200, {}, "Criteria deleted successfully"));
  });

const setInternshipDeadline = asyncHandler(async (req, res) => {
  const { deadlineDate } = req.body;

  if (!deadlineDate || !/^\d{4}-\d{2}-\d{2}$/.test(deadlineDate)) {
    throw new ApiError(
      400,
      "Invalid deadline Date Format. Please provide a date in yyyy-mm-dd format."
    );
  }

  const date = new Date(deadlineDate);

  if (isNaN(date.getTime())) {
    throw new ApiError(
      400,
      "Invalid deadline Date. Please provide a valid date."
    );
  }
  await InternshipInfo.updateMany({}, { $set: { deadline: date } });

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Deadline for Internship is added"));
});

const setSeminarDeadline = asyncHandler(async (req, res) => {
  const { deadlineDate } = req.body;

  if (!deadlineDate || !/^\d{4}-\d{2}-\d{2}$/.test(deadlineDate)) {
    throw new ApiError(
      400,
      "Invalid deadline Date Format. Please provide a date in yyyy-mm-dd format."
    );
  }

  const date = new Date(deadlineDate);

  if (isNaN(date.getTime())) {
    throw new ApiError(
      400,
      "Invalid deadline Date. Please provide a valid date."
    );
  }
  await SeminarInfo.updateMany({}, { $set: { deadline: date } });

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Deadline for Seminar is added"));
});

export {
  registerAdmin,
  loginAdmin,
  registerMentor,
  deleteMentor,
  registerStudent,
  deleteStudent,
  deleteCriteria,
  updateTotalMarks,
  getCriterias,
  createCriteria,
  logoutAdmin,
  assignMentor,
  removeMentor,
  setInternshipDeadline,
  setSeminarDeadline,
};
