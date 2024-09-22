import Message from "../models/messageModel.js";

const getMessages = async (req, res) => {
  try {
    // Find all messages and populate the 'user' field with data from the 'User' model
    const messages = await Message.find().populate("user"); // This will replace the ObjectId with the actual user document

    if (messages.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No messages found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Messages retrieved successfully",
      data: messages,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve messages",
      error: err.message,
    });
  }
};

export { getMessages };
