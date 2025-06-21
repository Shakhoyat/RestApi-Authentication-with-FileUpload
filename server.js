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

// Rendering login.ejs template
app.get("/", (req, res) => {
  res.render("login.ejs", { url: null });
});

//Rendering register.ejs template
app.get("/register", (req, res) => {
  res.render("register.ejs", { url: null });
});
// Multer storage config
const storage = multer.diskStorage({
  filename: function (_req, file, cb) {
    const uniqueSuffix = Date.now() + path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});
const upload = multer({ storage: storage });

// Mongoose schema/model
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  filename: String,
  public_id: String,
  imgUrl: String,
});
const User = mongoose.model("user", userSchema);

// Upload endpoint
app.post("/register", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("File is required");
  }
  const filePath = req.file.path;
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).send("All fields are required");
  }
  const cloudinaryResponse = await cloudinary.uploader.upload(filePath, {
    folder: "Nodejs101",
  });

  // Creating a user in MongoDB

  const db = await User.create({
    name,
    email,
    password,
    filename: req.file.originalname,
    public_id: cloudinaryResponse.public_id,
    imgUrl: cloudinaryResponse.secure_url,
  });
  res.redirect("/");
  // res.render("register.ejs", { url: cloudinaryResponse.secure_url });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
