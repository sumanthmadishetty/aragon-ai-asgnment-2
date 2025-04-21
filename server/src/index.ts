import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { connectDB, disconnectDB } from "./config/database";
import routes from "./routes";
import config from "./config/app";

// Load environment variables
dotenv.config(); // Load environment variables from .env file first
// Then load environment-specific variables

const app = express();
const PORT = process.env.PORT || 5002;
const isProduction = process.env.NODE_ENV === "production";

// Security middleware
// app.use(helmet()); // Set security headers

// // Configure CORS
// const corsOptions = {
//   origin: "*",
//   methods: "GET,HEAD,PUT,PATCH,POST,DELETE, OPTIONS",
//   preflightContinue: false,
//   optionsSuccessStatus: 204,
//   credentials: true,
//   allowedHeaders: ["Content-Type", "Authorization"],
// };
app.use(cors());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // Allow all origins
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// Performance and parsing middleware
app.use(compression()); // Compress responses
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// app.options("*", cors()); // enable pre-flight across-the-board

// Increase payload limit for file uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Logging middleware - use 'combined' format in production for more details
app.use(morgan(isProduction ? "combined" : "dev"));

// Welcome route
app.get("/", (req, res) => {
  res.send("Image Processing API is running");
});

// API routes
app.use("/api", routes);

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({
      error: isProduction ? "Internal Server Error" : err.message,
      stack: isProduction ? undefined : err.stack,
    });
  }
);

// Database connection and server startup
async function startServer() {
  try {
    // Connect to the database
    await connectDB();

    // Start the server
    const server = app.listen(PORT, () => {
      console.log(
        `🚀 Server running in ${
          process.env.NODE_ENV || "development"
        } mode on port ${PORT}`
      );
      console.log(
        `Health check available at http://localhost:${PORT}/api/health`
      );
    });

    // Handle graceful shutdown
    process.on("SIGTERM", async () => {
      console.log("SIGTERM received. Shutting down gracefully...");
      server.close(async () => {
        console.log("Server closed.");
        await disconnectDB();
        process.exit(0);
      });
    });

    process.on("SIGINT", async () => {
      console.log("SIGINT received. Shutting down gracefully...");
      server.close(async () => {
        console.log("Server closed.");
        await disconnectDB();
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
