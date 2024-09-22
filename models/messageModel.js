import mongoose from "mongoose";

// Define the message schema
const messageSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User model
      required: true, // Ensure a user reference is required
    },
  },
  { timestamps: true }
);

// Create the Message model
const Message = mongoose.model("Message", messageSchema);

export default Message;
