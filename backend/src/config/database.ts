import { Pool } from "pg";
import { env } from "./env";

const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  ssl: true,
});

pool.on("connect", () => {
  console.log("Successfully connected to the PostgreSQL database");
});

export const connectToDatabase = async () => {
  let client;
  try {
    client = await pool.connect();
  } catch (error) {
    console.error("Database connection verification failed!", error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
};
