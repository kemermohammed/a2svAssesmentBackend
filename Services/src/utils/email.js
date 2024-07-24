import nodemailer from "nodemailer";
import AppError from "./appError.js";

const sendEmail = async (options) => {
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2) Define the email options
  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  try {
    // 3) Actually send the email
    await transporter.sendMail(mailOptions);
  } catch (error) {
    if (error.code === "ENOTFOUND" || error.code === "EENVELOPE") {
      throw new AppError("Email address not found", 404);
    }

    throw error;
  }
};

export default sendEmail;
