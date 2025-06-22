import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import tenantMiddleware from "./middleware/tenantMiddleware";
import { formatError } from "./utils/ApiError";
import userRoutes from "./routes/userRoutes";
import authRoutes from "./routes/authRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import swaggerUi from "swagger-ui-express";
import * as fs from "fs";
import * as path from "path";
import { AppDataSource } from "./config/data-source";
import cookieParser from "cookie-parser";
import adRouter from "./routes/adSettingRoutes";
import headerRouter from "./routes/adHeaderRoutes";
import publicRouter from "./routes/blogsRoutes";
import dashboardRouter from "./routes/dashboardRoutes";
import tenantRoutes from "./routes/tenantRoutes";
import siteSettingRoutes from "./routes/siteSettingRoutes";
import uploadRoutes from "./routes/uploadRoutes";
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
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "x-tenant"],
  optionsSuccessStatus: 204, // ✅ Prevents CORS preflight issues
};
app.use((req, _res, next) => {
  if (req.headers["x-tenant"]) (req as any).tenant = req.headers["x-tenant"];
  next();
});
app.use(cors(corsOptions));
app.use(cookieParser());

// ✅ Enable JSON parsing
app.use(express.json());

// ✅ Apply multi-tenant middleware
app.use(tenantMiddleware);

// ✅ Mount API Routes
app.get("/health", (_req, res) => {
  res.status(200).send("OK");
});
app.use("/api/settings/uploadLogo", uploadRoutes);
app.use("/api/settings/users", userRoutes);
app.use("/api/settings/ads", adRouter);
app.use("/api/settings/ads/header", headerRouter);
app.use("/api/settings/site", siteSettingRoutes);
app.use("/api/dashboard/blogs", dashboardRouter);

app.use("/api/auth", authRoutes);

app.use("/api/blogs", publicRouter);
app.use("/api/categories", categoryRoutes);
app.use("/api/tenants", tenantRoutes);

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
