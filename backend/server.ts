import express, { Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import path from "path";
import SwaggerParser from "@apidevtools/swagger-parser";
import { connectDB } from "./src/config/prisma";
import datasetsRouter from "./src/modules/datasets/datasets.routes";
import initRouter from "./src/modules/init/init.routes";
import publishersRouter from "./src/modules/publishers/publishers.routes";
import responsesRouter from "./src/modules/responses/responses.routes";
import commentsRouter from "./src/modules/comments/comments.routes";
import cors, { CorsOptions } from "cors";

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const app = express();
const port: number = process.env.PORT ? Number(process.env.PORT) : 3000;

const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) {
      return callback(null, true);
    }

    if (/^http:\/\/localhost(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }

    if (origin === "https://r-gradani.onrender.com") {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.json({ status: "ok", message: "R-Gradani backend" });
});

app.use("/api/skupovi", datasetsRouter);
app.use("/api/izdavaci", publishersRouter);
app.use("/api/init", initRouter);
app.use("/api/odgovori", responsesRouter);
app.use("/api/komentari", commentsRouter);

const startServer = async () => {
  await connectDB();

  try {
    const openApiPath = path.resolve(__dirname, "openapi/openapi.yaml");
    const openApiSpec = await SwaggerParser.bundle(openApiPath);
    app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
  } catch (error) {
    console.error("Error loading or bundling OpenAPI spec:", error);
  }

  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
    console.log(`API documentation available at http://localhost:${port}/docs`);
  });
};

startServer();
