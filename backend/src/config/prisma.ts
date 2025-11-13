import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("Successfully connected to the PostgreSQL database");
  } catch (error) {
    console.error("Database connection failed!", error);
    process.exit(1);
  }
};

export default prisma;
