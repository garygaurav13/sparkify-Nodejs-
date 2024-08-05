// multer code for avatar upload
const multer = require("multer");
const multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3");
const path = require("path");

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  region: process.env.S3_REGION_KEY,
});

const s3Storage = multerS3({
  s3: s3, // s3 instance
  bucket: process.env.S3_BUCKET_NAME, // change it as per your project requirement
  acl: "public-read", // storage access type
  contentType: multerS3.AUTO_CONTENT_TYPE,
  metadata: (req, file, cb) => {
    cb(null, { fieldname: file.fieldname });
  },
  key: (req, file, cb) => {
    const fileExtension = mimeToExtension[file.mimetype];
    const fileName =
      process.env.S3_USER_AVATAR_PATH +
      Date.now() +
      "_" +
      file.fieldname +
      fileExtension; // Append the extension to the file name
    cb(null, fileName);
  },
});


const upload = (fieldName) => multer({
  storage: s3Storage,
  limits: { fileSize: 10 * 1000 * 1000 },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype == "image/png" ||
      file.mimetype == "image/jpg" ||
      file.mimetype == "image/jpeg" ||
      file.mimetype == "image/webp"
    ) {
      cb(null, true);
    } else {
      cb(`File format is not support`, false);
      return cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
    }
  },
}).single(fieldName);

const mimeToExtension = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/webp': '.webp',
  // Add more MIME types and extensions as needed
};

module.exports = upload;
