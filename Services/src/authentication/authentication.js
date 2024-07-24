import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { User } from "../models/adminModel";
import util from "util";
import crypto from "crypto";
import sendEmail from "../utils/email";

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "90d",
  });
};

const createSendToken = (user, statusCode, res) => {
  if (user.verified && user.approved) {
    const token = signToken(user._id);
    const cookieOptions = {
      expires: new Date(
        Date.now() +
          parseInt(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
    };

    res.cookie("token", token, cookieOptions);

    user.password = undefined;
    res.status(statusCode).json({
      status: "success",
      data: {
        user,
      },
    });
  } else {
    res.status(403).json({
      status: "failed",
      message: "please verify your account",
    });
  }
};

export const signup = async (req, res, next) => {
  const lengthOfUsers = await User.countDocuments();
  req.body.role = lengthOfUsers === 0 ? "owner" : "user";
  req.body.approved = lengthOfUsers === 0;

  const existingUnverifiedUser = await User.findOne({
    email: req.body.email,
    verified: false,
  });

  if (existingUnverifiedUser) {
    await User.deleteOne({ _id: existingUnverifiedUser._id });
  }

  const newUser = await User.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    role: req.body.role,
    verified: false,
  });

  const resetToken = newUser.createPasswordResetToken();
  await newUser.save({ validateBeforeSave: false });

  const verificationURL = `${process.env.FRONTEND_URL}/verify/${resetToken}`;

  const message = `click the link to verify your email: ${verificationURL}.\nIf you didn't signup, please ignore this email!`;

  await sendEmail({
    email: req.body.email,
    subject: "Account verification (valid for an hour)",
    message,
  });

  res.status(200).json({
    status: "success",
    message: `We have sent a verification email to ${req.body.email}, please verify your account`,
  });
};

export const verification = async (req, res, next) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    res
      .status(400)
      .json({ status: "failed", message: "Token is invalid or has expired" });
    return;
  }

  user.verified = true;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save({ validateBeforeSave: false });

  return createSendToken(user, 200, res);
};

export const signin = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      status: "failed",
      message: "Please provide email and password!",
    });
    return;
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    res
      .status(401)
      .json({ status: "failed", message: "Incorrect email or password" });
    return;
  }

  createSendToken(user, 200, res);
};

export const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    res.status(401).json({
      status: "failed",
      message: "You are not logged in! Please log in to get access.",
    });
    return;
  }

  const decoded = await util.promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    res.status(401).json({
      status: "failed",
      message: "The user belonging to this token does no longer exist.",
    });
    return;
  }

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    res.status(401).json({
      status: "failed",
      message: "User recently changed password! Please log in again.",
    });
    return;
  }

  req.user = currentUser;
  next();
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        status: "failed",
        message: "You do not have permission to perform this action",
      });
      return;
    }
    next();
  };
};

export const forgotPassword = async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    res.status(404).json({
      status: "failed",
      message: "There is no user with this email address.",
    });
    return;
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  await sendEmail({
    email: user.email,
    subject: "Your password reset token (valid for an hour)",
    message,
  });

  res.status(200).json({
    status: "success",
    message: `We have sent a verification token to ${req.body.email}`,
  });
};

export const resetPassword = async (req, res, next) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    res
      .status(400)
      .json({ status: "failed", message: "Token is invalid or has expired" });
    return;
  }

  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  createSendToken(user, 200, res);
};

export const updatePassword = async (req, res, next) => {
  const user = await User.findById(req.user._id).select("+password");

  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    res
      .status(401)
      .json({ status: "failed", message: "Your current password is wrong." });
    return;
  }

  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();

  createSendToken(user, 200, res);
};

export const logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
  });
  res.status(200).json({ status: "success" });
};
