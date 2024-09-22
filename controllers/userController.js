import User from "../models/userModel.js";
import twilio from "twilio";
import dotenv from "dotenv";
import { generateOtp } from "../utils/generateOtp.js";
import Message from "../models/messageModel.js";
import UserVerification from "../models/userVerificationModel.js";
dotenv.config();
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_SERVICE_SID;

const twilioClient = twilio(accountSid, authToken, { lazyLoading: true });

//@desc Creates new user
//@route POST/api/users
//@access PUBLIC
const createUser = async (req, res) => {
  try {
    const { firstName, lastName, mobileNumber } = req.body;

    // Check if a user with the same mobile number already exists
    const existingUser = await User.findOne({ mobileNumber });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this mobile number already exists",
      });
    }

    // Create a new user instance
    const newUser = new User({
      firstName,
      lastName,
      mobileNumber,
      isVerified: false,
    });

    // Save the user to the database
    const savedUser = await newUser.save();

    // If success, send a success response
    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: savedUser,
    });
  } catch (err) {
    // Handle errors and send a failure response
    res.status(500).json({
      success: false,
      message: "Failed to create user",
      error: err.message, // For debugging, you can log the actual error message
    });
  }
};

//@desc gets the list of users
//@route GET/api/users
//@access PUBLIC
const getUsers = async (req, res) => {
  try {
    const users = await User.find();

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No users found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: users,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve users",
      error: err.message,
    });
  }
};

//@desc gets the details of single user
//@route GET/api/users/:id
//@access PUBLIC
const getSingleUser = async (req, res) => {
  try {
    // Extract user ID from the request parameters
    const userId = req.params.id;

    // Find the user by their ID
    const user = await User.findById(userId);

    // If user is not found, send a 404 response
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // If user is found, send a success response with the user data
    res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      data: user,
    });
  } catch (err) {
    // Handle invalid ID format or other errors
    res.status(500).json({
      success: false,
      message: "Failed to retrieve user",
      error: err.message, // For debugging purposes
    });
  }
};

//@desc deletes a single user
//@route DELETE /api/users/:id
//@access PUBLIC
const deleteUser = async (req, res) => {
  try {
    // Extract user ID from the request parameters
    const userId = req.params.id;

    // Find the user by their ID and delete them
    const user = await User.findByIdAndDelete(userId);

    // If user is not found, send a 404 response
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // If user is deleted successfully, send a success response
    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    // Handle errors (like invalid ID format)
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: err.message, // For debugging purposes
    });
  }
};

// MOBILE OTP LOGIC

async function sendOtp(mobileNumber, otp, userId) {
  const messageBody = `Your mobile verification otp is ${otp}`;
  const phoneNumber = `+91${mobileNumber}`;

  try {
    // Send OTP via Twilio
    await twilioClient.messages.create({
      body: messageBody,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    console.log("OTP sent:", messageBody);

    // After sending OTP, store the message in the database
    const newMessage = new Message({
      message: messageBody, // Store the message content (OTP)
      user: userId, // Associate the message with the user's ID
    });

    await newMessage.save(); // Save the message to the database
    console.log("Message stored in database");
  } catch (err) {
    console.error("Failed to send OTP or store message:", err);
    throw new Error("Failed to send OTP");
  }
}

// mobile otp handler
const mobileOtpHandler = async (req, res) => {
  try {
    const { mobileNumber, otp } = req.body;
    const { id } = req.params;

    // generate otp and store it in the user verification model in db
    const userMobileVerification = await UserVerification.create({
      mobileNumber,
      mobileOtp: otp,
    });

    if (userMobileVerification) {
      // Send otp via twilio
      await sendOtp(mobileNumber, otp, id);
      res.status(200).json({
        success: true,
        message: `added credentials in user verification , and otp ${otp} sent to +91 ${mobileNumber}`,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Failed to send otp",
      error: err.message,
    });
  }
};

const resendMobileOtpHandler = async (req, res) => {
  try {
    const { mobileNumber, otp } = req.body;
    const user = await UserVerification.findOne({ mobileNumber });

    const deleteCurrentUserVerification = await user.deleteOne();

    if (deleteCurrentUserVerification) {
      res.status(299).json({
        success: true,
        message: `A new otp has been sent to ${mobileNumber}`,
      });
      await mobileOtpHandler(req, res);
    }
  } catch (err) {
    console.log(err.message);
    res.status(500).json({
      success: false,
      message: "Some error occured while resending otp ",
      error: err.message,
    });
  }
};

const verifyUserMobile = async (req, res) => {
  try {
    const { mobileNumber, enteredOtp } = req.body;
    const verifyUser = await UserVerification.findOne({ mobileNumber });

    if (!verifyUser) {
      return res.status(404).json({
        status: "Fail",
        message: "User verification record not found",
      });
    }

    if (verifyUser.mobileOtp === enteredOtp) {
      // Delete the verification record
      await verifyUser.deleteOne();

      // Update the isVerified field
      await User.findOneAndUpdate(
        { mobileNumber },
        { $set: { isVerified: true } }
      );

      return res.status(200).json({
        success: true,
        message: "Mobile verified successfully",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Incorrect OTP",
      });
    }
  } catch (err) {
    console.error(err); // Log the error for debugging
    return res.status(500).json({
      success: false,
      message: "Some error occurred while verifying OTP",
      error: err.message,
    });
  }
};

export {
  getUsers,
  getSingleUser,
  createUser,
  mobileOtpHandler,
  resendMobileOtpHandler,
  verifyUserMobile,
  deleteUser,
};
