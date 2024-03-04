import { EvaluationCriteria } from "../models/evaluationCriteria.model.js";
import { InternshipEvaluationCriteria } from "../models/internshipEvaluationCriteria.model.js";
import { SeminarEvaluationCriteria } from "../models/seminarEvaluationCriteria.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Mentor } from "../models/mentor.model.js";
import { Student } from "../models/student.model.js";
import { Admin } from "../models/admin.model.js";
import nodemailer from "nodemailer";
import { StudentEvaluation } from "../models/studentEvaluation.model.js";

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
      text: `Your username: ${username}\nYour temporary password: ${password}`,
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
    .json(200, new ApiResponse(200, {}, "Admin Logged out Successfully!"));
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

  const password = "pict123";
  // await sendEmail(email, username, password);   //*test

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

  // await sendEmail(email, username, password);  //?final wala

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

  const password = "pict123";
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

  res
    .status(200)
    .json(new ApiResponse(200, createdStud, "Student registered Successfully"));
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

const getCriterias = (evalType) => {
  return asyncHandler(async (req, res) => {
    let criterias;

    if (evalType === "seminar") {
      criterias = await SeminarEvaluationCriteria.find({});
    } else if (evalType === "internship") {
      criterias = await InternshipEvaluationCriteria.find({});
    }

    let totalMarks = 0;
    criterias.forEach((criteria) => {
      totalMarks += criteria.criteriaMarks;
    });

    res.status(200).json(new ApiResponse(200, { criterias, totalMarks }));
  });
};

const createCriteria = (evalType) => {
  return asyncHandler(async (req, res) => {
    const { criteriaName, criteriaMarks } = req.body;

    if (!criteriaMarks || !criteriaMarks) {
      throw new ApiError(400, "Name or Marks not provided properly.");
    }

    let newCriteria;

    if (evalType === "seminar") {
      const existingCriteria = await SeminarEvaluationCriteria.find({
        name: criteriaName,
      });

      if (existingCriteria.length) {
        console.log(existingCriteria);
        throw new ApiError(409, "Criteria already exists");
      }

      newCriteria = await SeminarEvaluationCriteria.create({
        name: criteriaName,
        criteriaMarks,
      });
    } else if (evalType === "internship") {
      const existingCriteria = await InternshipEvaluationCriteria.find({
        name: criteriaName,
      });

      if (existingCriteria.length) {
        console.log(existingCriteria);
        throw new ApiError(409, "Criteria already exists");
      }

      newCriteria = await InternshipEvaluationCriteria.create({
        name: criteriaName,
        criteriaMarks,
      });
    }

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

// yet to be implemented
const deleteCriteria = asyncHandler(async (req, res) => {
  const criteriaId = req.params.id;
  const criteria = await EvaluationCriteria.findById(criteriaId);

  if (!criteria) {
    throw new ApiError(404, "Criteria doesn't exists.");
  }

  await EvaluationCriteria.findOneAndDelete(criteria);

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Criteria deleted successfully"));
});

const getCriteriaInfo = asyncHandler(async (criteriaId) => {
  const res = await EvaluationCriteria.findById(criteriaId);

  return res;
});

export {
  registerAdmin,
  loginAdmin,
  registerMentor,
  registerStudent,
  deleteCriteria,
  getCriterias,
  createCriteria,
  logoutAdmin,
  assignMentor,
  removeMentor,
};
