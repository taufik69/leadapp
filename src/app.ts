import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import {
  globalErrorHandler,
  notFoundHandler,
} from "./shared/middlewares/error-handler.middleware";
import userRoutes from "./modules/user/routes/user.routes";
import leadRoutes from "./modules/lead/routes/lead.routes";

const app: Application = express();

// Security & utility middlewares
app.use(helmet());
app.use(cors());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1", leadRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler — must be last
app.use(globalErrorHandler);

export default app;
