import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); //jo user ne rakha wahi name se server pe thoda time upload krdo file , badme it'll go to cloudinary
    //this is not good actually, user can upload 2-3 same name wale file but it ll wait for short time on server so its ok!
  },
});

export const upload = multer({
  storage,
  //  storage: storage,  // es6 mai u can write uapr jaise bhi
});
