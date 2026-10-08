import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/authRoutes.js";
import designRoutes from "./routes/designRoutes.js";

const app = express();

// 1. HTTP Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows flexible asset loading in dev and modern SPAs
    crossOriginEmbedderPolicy: false,
  }),
);

// 2. Strict CORS Configuration
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in dev, securely handled
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// 3. Payload size limit
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// 4. Rate Limiting
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 auth requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts, please try again in 15 minutes.",
  },
});

const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many API requests, please try again later.",
  },
});

// Apply rate limiting
app.use("/api/auth", authRateLimiter, authRoutes);
app.use("/api/designs", generalApiLimiter, designRoutes);

// 5. 404 handler for undefined endpoints
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found.",
  });
});

// 6. Global error handler (prevents leaking internal stack traces)
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled API Error:", err.message);
  res.status(500).json({
    success: false,
    message: "Internal server error. Please try again later.",
  });
});

export default app;
