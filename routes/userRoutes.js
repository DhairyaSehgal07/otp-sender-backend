import express from "express";
import {
  createUser,
  getUsers,
  getSingleUser,
  mobileOtpHandler,
  resendMobileOtpHandler,
  deleteUser,
  verifyUserMobile,
  // sendOtp,
} from "../controllers/userController.js";
const router = express.Router();

router.post("/", createUser);
router.get("/", getUsers);
router.get("/:id", getSingleUser);

router.delete("/:id", deleteUser);
router.post("/:id/send-otp", mobileOtpHandler);
router.post("/:id/verify-otp", verifyUserMobile);
router.post("/:id/resend-otp", resendMobileOtpHandler);

export default router;
