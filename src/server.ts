import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import tenantMiddleware from "./middleware/tenantMiddleware";
import { formatError } from "./utils/ApiError";
import userRoutes from "./routes/userRoutes";
import authRoutes from "./routes/authRoutes";
import blogRoutes from "./routes/blogsRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import swaggerUi from "swagger-ui-express";
import * as fs from "fs";
import * as path from "path";
import { AppDataSource } from "./config/data-source";

const app = express();

// ✅ Read main domain from .env (e.g., 'localhost' or 'yourdomain.com')
const MAIN_DOMAIN = process.env.MAIN_DOMAIN || "localhost";

// ✅ Configure dynamic CORS middleware
const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    if (!origin) {
      return callback(null, true); // Allow requests without an origin (Postman, Server-to-Server requests)
    }

    try {
      const url = new URL(origin);
      const hostname = url.hostname;

      // ✅ Allow main domain and all subdomains
      if (
        hostname === MAIN_DOMAIN || // Main domain (e.g., 'localhost')
        hostname.endsWith(`.${MAIN_DOMAIN}`) // Subdomains (e.g., 'publisher1.localhost')
      ) {
        return callback(null, true);
      }

      return callback(new Error("❌ Not allowed by CORS"));
    } catch (error) {
      return callback(new Error("❌ Invalid Origin"));
    }
  },
  credentials: true, // ✅ Allows cookies & authentication headers
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204, // ✅ Prevents CORS preflight issues
};

app.use(cors(corsOptions));

// ✅ Enable JSON parsing
app.use(express.json());

// ✅ Apply multi-tenant middleware
app.use(tenantMiddleware);

// ✅ Mount API Routes
app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/categories", categoryRoutes);

// ✅ Serve Swagger API documentation
const swaggerDocumentPath = path.join(__dirname, "./docs/swagger.json");
const swaggerDocument = JSON.parse(
  fs.readFileSync(swaggerDocumentPath, "utf8")
);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ✅ Global error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  const formattedError = formatError(err);
  res.status(formattedError.status).json(formattedError);
});

// ✅ Set PORT dynamically
const PORT = process.env.PORT || 5000;

// ✅ Initialize database and start the server
AppDataSource.initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(
        `📄 Swagger docs available at http://localhost:${PORT}/api-docs`
      );
    });
  })
  .catch((error: any) => {
    console.error("❌ Error during Data Source initialization:", error);
  });
