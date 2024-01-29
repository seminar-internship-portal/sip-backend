import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asynchandler.js";
import jwt, { decode } from "jsonwebtoken";
import { Student } from "../models/student.model.js";
import { Mentor } from "../models/mentor.model.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    //in header ull get Bearer token so we removing Bearer <space> and just token remains
    if (!token) {
      throw new ApiError(401, "Unauthorized Request!");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    let userModel;
    console.log(decodedToken.roleType);
    if (decodedToken.roleType === "student") {
      userModel = Student;
    } else if (decodedToken.roleType === "mentor") {
      userModel = Mentor;
    } else {
      throw new ApiError(400, "Invalid User Type in Token!");
    }

    const user = await userModel
      .findById(decodedToken?._id)
      .select("-password -refreshToken");
    if (!user) {
      throw new ApiError(401, "Invalid Access Token!");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
