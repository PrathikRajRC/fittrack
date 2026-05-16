import { PrismaClient } from "@prisma/client";

// Singleton — reuse across all route handlers
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

export default prisma;
