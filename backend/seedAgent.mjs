import bcrypt from "bcryptjs";
import pkgClient from "@prisma/client";
const { PrismaClient } = pkgClient;
import { PrismaPg } from "@prisma/adapter-pg";
import pkgPg from "pg";
const { Pool } = pkgPg;
import dotenv from "dotenv";
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedAgent() {
  const email = "agent@threadly.com";
  const password = "agent123";
  const role = "AGENT";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Agent already exists: ${email}`);
    await pool.end();
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, role },
  });

  console.log(`Agent created successfully!`);
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log(`  Role:     ${user.role}`);
  await pool.end();
  process.exit(0);
}

seedAgent().catch(async (e) => {
  console.error(e);
  await pool.end();
  process.exit(1);
});
