import pkgClient from '@prisma/client';
const { PrismaClient } = pkgClient; // Ye line error solve kar degi

import { PrismaPg } from "@prisma/adapter-pg";
import pkgPg from "pg";
const { Pool } = pkgPg;

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Prisma 7 adapter setup
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export default prisma;