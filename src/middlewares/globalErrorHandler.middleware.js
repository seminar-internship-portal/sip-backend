import { ApiError } from "../utils/ApiError.js";

const globalErrorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    // Handle specific API errors
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  } else {
    // Handle generic errors
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export default globalErrorHandler;
