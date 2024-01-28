import { Mentor } from "../models/mentor.model.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens = async (mentorId) => {
  try {
    const mentor = await Mentor.findById(mentorId);
    const accessToken = mentor.generateAccessToken();
    const refreshToken = mentor.generateRefreshToken();

    mentor.refreshToken = refreshToken; //db mai dalenge na
    await mentor.save({ validateBeforeSave: false }); //save in db w/o validating or else password will be replaced

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

export { getAllMentors, registerMentor, loginMentor };
