import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Connect to MongoDB using .env variables
mongoose
  .connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DBNAME })
  .then(() => {
    console.log("Connected to MongoDB successfully");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });

// Rendering ejs template
app.get("/", (req, res) => {
  res.render("index.ejs", { url: null });
});

// Multer storage config
const storage = multer.diskStorage({
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});
const upload = multer({ storage: storage });

// Mongoose schema/model
const imageSchema = new mongoose.Schema({
  filename: String,
  public_id: String,
  imgUrl: String,
});
const File = mongoose.model("cloudinary", imageSchema);

// Upload endpoint
app.post("/upload", upload.single("file"), async (req, res) => {
  const file = req.file.path;
  const cloudinaryResponse = await cloudinary.uploader.upload(file, {
    folder: "Nodejs101",
  });
  await File.create({
    filename: req.file.originalname,
    public_id: cloudinaryResponse.public_id,
    imgUrl: cloudinaryResponse.secure_url,
  });
  res.render("index.ejs", { url: cloudinaryResponse.secure_url });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
