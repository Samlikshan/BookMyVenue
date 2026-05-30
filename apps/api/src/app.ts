import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import router from "./routes/index.js";

export const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(morgan("dev"));

app.use('/api', router);

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "BookMyVenue API is running",
  });
});