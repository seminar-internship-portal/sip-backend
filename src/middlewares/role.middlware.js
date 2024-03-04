import { ApiError } from "../utils/ApiError.js";
import jwt, { decode } from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyRole = (rType) =>
  asyncHandler(async (req, _, next) => {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized Request!");
    }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (!(decodedToken.roleType === rType)) {
      throw new ApiError(401, "Unauthorized Role");
    }
    next();
  });
