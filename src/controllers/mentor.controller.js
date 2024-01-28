import { Mentor } from "../models/mentor.model.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getAllMentors = asyncHandler(async (req, res) => {
  const mentors = await Mentor.find({});
  const mentorData = mentors.map((ment) => {
    return {
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
    username: username,
    email,
    registrationId,
    fullName,
    password,
    mobileNo,
    avatar,
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

export { getAllMentors, registerMentor };
