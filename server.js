import express from "express";
import dotenv from "dotenv";
import cors from "cors"; // Import cors
import userRoutes from "./routes/userRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import connectDb from "./utils/db.js";

dotenv.config();
connectDb();

const app = express();

const PORT = process.env.PORT || 5000;

// Use CORS middleware to allow requests from everywhere
app.use(
  cors({
    origin: "*", // Allow requests from any origin
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

app.get("/", (req, res) => {
  res.status(200).send({
    message: "Server is running",
  });
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
