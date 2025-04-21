import { PrismaClient } from "@prisma/client";

// Create a singleton instance of Prisma Client
const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
});

// Connect to the database when the server starts
async function connectDB() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection error:", error);
    process.exit(1);
  }
}

// Disconnect from the database when the server stops
async function disconnectDB() {
  await prisma.$disconnect();
  console.log("Database disconnected");
}

export { prisma, connectDB, disconnectDB };
