import { asyncHandler } from "../utils/asyncHandler.js";
import { Student } from "../models/student.model.js";
import { Mentor } from "../models/mentor.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { SeminarInfo } from "../models/seminarFiles.model.js";
import { InternshipInfo } from "../models/internshipFiles.model.js";

// seminar wale chije!!
const uploadReport = asyncHandler(async (req, res) => {
  const reportLocalPath = req.file?.path;
  const { id } = req.body;

  if (!reportLocalPath) {
    throw new ApiError(400, "Report  is missing!");
  }

  //TODO: delete the old avatar from cloudinary!
  const report = await uploadOnCloudinary(reportLocalPath);

  if (!report.url) {
    throw new ApiError(400, "Error while uploading report");
  }

  const seminarArticle = await SeminarInfo.findOneAndUpdate(
    { owner: id },
    {
      $set: {
        report: report.url,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        seminarArticle,
        "Student's Report Uploaded Successfully!"
      )
    );
});

const uploadAbstract = asyncHandler(async (req, res) => {
  const abstractLocalPath = req.file?.path;
  const { id } = req.body;
  if (!abstractLocalPath) {
    throw new ApiError(400, "Abstract is missing!");
  }

  //TODO: delete the old avatar from cloudinary!
  const abstract = await uploadOnCloudinary(abstractLocalPath);

  if (!abstract.url) {
    throw new ApiError(400, "Error while uploading on abstract");
  }

  const seminarArticle = await SeminarInfo.findOneAndUpdate(
    { owner: id },
    { $set: { abstract: abstract.url } },
    { new: true }
  );

  if (!seminarArticle) {
    throw new ApiError(400, "Error while uploading Abstract!");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        seminarArticle,
        "Student's abstract Uploaded Successfully!"
      )
    );
});

const uploadPPT = asyncHandler(async (req, res) => {
  const pptLocalPath = req.file?.path;
  const { id } = req.body;
  if (!pptLocalPath) {
    throw new ApiError(400, "Presentation is missing!");
  }

  //TODO: delete the old avatar from cloudinary!
  const ppt = await uploadOnCloudinary(pptLocalPath);

  if (!ppt.url) {
    throw new ApiError(400, "Error while uploading PPT");
  }

  const seminarArticle = await SeminarInfo.findOneAndUpdate(
    { owner: id },
    { $set: { ppt: ppt.url } },
    { new: true }
  );

  if (!seminarArticle) {
    throw new ApiError(400, "Error while uploading PPT!");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        seminarArticle,
        "Student's Presentation Uploaded Successfully!"
      )
    );
});

//internship
const uploadOfferLetter = asyncHandler(async (req, res) => {
  const offerLetterLocalPath = req.file?.path;
  const { id } = req.body;
  if (!offerLetterLocalPath) {
    throw new ApiError(400, "Offer-Letter is missing!");
  }

  //TODO: delete the old avatar from cloudinary!
  const ol = await uploadOnCloudinary(offerLetterLocalPath);

  if (!ol.url) {
    throw new ApiError(400, "Error while uploading OfferLetter");
  }
  const article = await InternshipInfo.findById(id);
  if (!article) {
    throw new ApiError(400, "Internship not found");
  }
  const internshipArticle = await InternshipInfo.findByIdAndUpdate(
    id,
    { $set: { offerLetter: ol.url } },
    { new: true }
  );

  if (!internshipArticle) {
    throw new ApiError(400, "Error while uploading offerletter!");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        internshipArticle,
        "Student's offerletter Uploaded Successfully!"
      )
    );
});

const uploadCompletionLetter = asyncHandler(async (req, res) => {
  const completionLetterLocalPath = req.file?.path;
  const { id } = req.body;
  if (!completionLetterLocalPath) {
    throw new ApiError(400, "Completion-Letter is missing!");
  }

  //TODO: delete the old avatar from cloudinary!
  const cl = await uploadOnCloudinary(completionLetterLocalPath);

  if (!cl.url) {
    throw new ApiError(400, "Error while uploading completion letter");
  }
  const article = await InternshipInfo.findById(id);
  if (!article) {
    throw new ApiError(400, "Internship not found");
  }
  const internshipArticle = await InternshipInfo.findByIdAndUpdate(
    id,
    { $set: { completionLetter: cl.url } },
    { new: true }
  );

  if (!internshipArticle) {
    throw new ApiError(400, "Error while uploading completion letter!");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        internshipArticle,
        "Student's completion letter Uploaded Successfully!"
      )
    );
});

const uploadPermissionLetter = asyncHandler(async (req, res) => {
  const permissionLetterLocalPath = req.file?.path;
  const { id } = req.body;
  if (!permissionLetterLocalPath) {
    throw new ApiError(400, "Permission-Letter is missing!");
  }

  //TODO: delete the old avatar from cloudinary!
  const pl = await uploadOnCloudinary(permissionLetterLocalPath);

  if (!pl.url) {
    throw new ApiError(400, "Error while uploading permission Letter");
  }
  const article = await InternshipInfo.findById(id);
  if (!article) {
    throw new ApiError(400, "Internship not found");
  }
  const internshipArticle = await InternshipInfo.findByIdAndUpdate(
    id,
    { $set: { permissionLetter: pl.url } },
    { new: true }
  );

  if (!internshipArticle) {
    throw new ApiError(400, "Error while uploading permission Letter!");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        internshipArticle,
        "Student's permission Letter Uploaded Successfully!"
      )
    );
});
export {
  uploadReport,
  uploadAbstract,
  uploadPPT,
  uploadOfferLetter,
  uploadCompletionLetter,
  uploadPermissionLetter,
};
