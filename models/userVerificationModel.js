import mongoose from "mongoose";

const userVerificationSchema = mongoose.Schema(
  {
    mobileNumber: {
      type: String,
      required: true,
    },

    mobileOtp: { type: String, default: "" },
  },
  { timestamps: true }
);

const UserVerification = mongoose.model(
  "UserVerification",
  userVerificationSchema
);

export default UserVerification;
