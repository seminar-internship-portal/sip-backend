import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

import studentData from "../data.js";
const getData = asyncHandler(async (req, res) => {
  try {
    res.json(studentData);
  } catch {
    throw new ApiError(501, "Data not Found!");
  }
});

export default getData;
