// Local seeding entrypoint used by `prisma db seed` / `npm run prisma:seed`.
// The actual logic lives in src/db/seed.ts so it also compiles to dist for
// production (`node dist/db/seed.js`).
import { PrismaClient } from "@prisma/client";
import { runSeed } from "../src/db/seed";

const prisma = new PrismaClient();

runSeed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
