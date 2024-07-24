
import { User } from "../models/userModel";
import { Request, Response, NextFunction } from "express";



export const getMe = async (req, res, next) => {
  req.params.id = req.user._id;
  next();
};

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    res.status(200).json({
      status: "success",
      results: users.length,
      data: {
        users,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: "Failed to retrieve users" });
  }
};

export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res
        .status(404)
        .json({ status: "error", message: "No user found with that ID" });
      return;
    }
    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: "Failed to retrieve user" });
  }
};

export const updateUser = async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    res.status(400).json({
      status: "error",
      message:
        "This route is not for password updates. Please use /updateMyPassword.",
    });
    return;
  }

  if (req.file) req.body.photo = req.file.filename;
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      res
        .status(404)
        .json({ status: "error", message: "No user found with that ID" });
      return;
    }

    res.status(200).json({
      status: "success",
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Failed to update user" });
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      res
        .status(404)
        .json({ status: "error", message: "No user found with that ID" });
      return;
    }

    res.status(204).json({ status: "success", data: null });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Failed to delete user" });
  }
};
