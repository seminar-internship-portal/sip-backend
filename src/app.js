import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import globalErrorHandler from "./middlewares/globalErrorHandler.middleware.js";

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//routes
import studentRouter from "./routes/student.routes.js";
import mentorRouter from "./routes/mentor.routes.js";
import adminRouter from "./routes/admin.routes.js";

app.use("/api/v1/student", studentRouter);
app.use("/api/v1/mentor", mentorRouter);
app.use("/api/v1/admin", adminRouter);

app.use(globalErrorHandler);
export { app };
