import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDB } from "../lib/mongodb";
import { getAdminUserModel } from "../models/AdminUser";

const SALT_ROUNDS = 12;

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;
  const name = process.env.ADMIN_SEED_NAME;

  if (!email || !password || !name) {
    throw new Error(
      "ADMIN_SEED_EMAIL, ADMIN_SEED_PASSWORD, and ADMIN_SEED_NAME must all be set",
    );
  }

  await connectDB();
  const AdminUser = getAdminUserModel();

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const normalizedEmail = email.trim().toLowerCase();

  await AdminUser.updateOne(
    { email: normalizedEmail },
    { $set: { email: normalizedEmail, passwordHash, name, role: "admin" } },
    { upsert: true },
  );

  console.log(`Admin user seeded successfully for ${normalizedEmail}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Failed to seed admin user:", err instanceof Error ? err.message : err);
    process.exit(1);
  });