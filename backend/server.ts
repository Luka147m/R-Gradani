import express, { Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import yaml from "js-yaml";
import fs from "fs";
import path from "path";
import { connectDB } from "./src/config/prisma"

const app = express();
const port: number = process.env.PORT ? Number(process.env.PORT) : 3000;

const openApiPath = path.resolve(__dirname, "openapi.yaml");
const openApiSpec = yaml.load(fs.readFileSync(openApiPath, "utf8")) as Record<string, unknown>;

app.use(express.json());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.get("/", (_req: Request, res: Response) => {
  res.json({ status: "ok", message: "R-Gradani backend" });
});

const startServer = async () => {
  await connectDB();
  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
    console.log(`API documentation available at http://localhost:${port}/docs`);
  });
};

startServer();
