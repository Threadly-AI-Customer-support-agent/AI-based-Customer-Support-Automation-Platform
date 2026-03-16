import { defineConfig } from "@prisma/config";
import "dotenv/config"; 

export default defineConfig({
  earlyAccess: true,
  schema: "prisma/schema.prisma",
  // Prisma 7 ke liye ye 'datasource' block hona zaroori hai
  datasource: {
    url: process.env.DATABASE_URL,
  },
});