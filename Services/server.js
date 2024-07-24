
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app.js"; 


dotenv.config();

const DB = process.env.DATABASE;

const connectDB = async () => {
  try {
   
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

   
    await mongoose.connect(DB, options);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};

connectDB();


const port = process.env.PORT || 8000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
