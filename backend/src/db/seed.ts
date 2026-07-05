import { PrismaClient, Priority } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: "Schedule Flex", slaHours: 24 },
  { name: "Attendance Coding", slaHours: 24 },
  { name: "Team Meeting Request", slaHours: 48 },
  { name: "Training Request", slaHours: 72 },
  { name: "Coaching Request", slaHours: 48 },
  { name: "Attendance Correction", slaHours: 24 },
  { name: "New Hire", slaHours: 96 },
  { name: "Employee Maintenance", slaHours: 48 },
];

const VENDORS = ["Intouch", "Inktel"];

const SLA_RULES: Array<{ priority: Priority; hoursToRespond: number; hoursToResolve: number }> = [
  { priority: "LOW", hoursToRespond: 8, hoursToResolve: 96 },
  { priority: "MEDIUM", hoursToRespond: 4, hoursToResolve: 48 },
  { priority: "HIGH", hoursToRespond: 2, hoursToResolve: 24 },
  { priority: "URGENT", hoursToRespond: 1, hoursToResolve: 8 },
];

/**
 * Idempotent seed: safe to run on every deploy. Reference data and users are
 * upserted; sample tickets are only created if their ticket number is missing.
 */
export async function runSeed() {
  console.log("Seeding reference data...");

  for (const category of CATEGORIES) {
    await prisma.category.upsert({ where: { name: category.name }, create: category, update: { slaHours: category.slaHours } });
  }

  for (const name of VENDORS) {
    await prisma.vendor.upsert({ where: { name }, create: { name }, update: {} });
  }

  for (const rule of SLA_RULES) {
    await prisma.slaRule.upsert({ where: { priority: rule.priority }, create: rule, update: rule });
  }

  await prisma.ticketSequence.upsert({ where: { id: 1 }, create: { id: 1, lastValue: 0 }, update: {} });

  console.log("Seeding users...");
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@wfmportal.com" },
    create: { email: "admin@wfmportal.com", passwordHash, firstName: "Ava", lastName: "Admin", role: "ADMIN" },
    update: {},
  });

  const wfmUser = await prisma.user.upsert({
    where: { email: "wfm@wfmportal.com" },
    create: { email: "wfm@wfmportal.com", passwordHash, firstName: "Wendy", lastName: "Falcon", role: "WFM" },
    update: {},
  });

  const opsUser = await prisma.user.upsert({
    where: { email: "ops@wfmportal.com" },
    create: { email: "ops@wfmportal.com", passwordHash, firstName: "Oscar", lastName: "Ops", role: "OPERATIONS" },
    update: {},
  });

  console.log("Seeding sample tickets...");
  const categories = await prisma.category.findMany();
  const vendors = await prisma.vendor.findMany();

  const sampleTickets: Array<{
    categoryName: string;
    vendorName: string;
    priority: Priority;
    status: "PENDING" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED";
    daysAgo: number;
  }> = [
    { categoryName: "Schedule Flex", vendorName: "Intouch", priority: "HIGH", status: "PENDING", daysAgo: 0 },
    { categoryName: "Attendance Coding", vendorName: "Inktel", priority: "MEDIUM", status: "ASSIGNED", daysAgo: 1 },
    { categoryName: "Training Request", vendorName: "Intouch", priority: "LOW", status: "IN_PROGRESS", daysAgo: 3 },
    { categoryName: "New Hire", vendorName: "Inktel", priority: "URGENT", status: "PENDING", daysAgo: 0 },
    { categoryName: "Coaching Request", vendorName: "Intouch", priority: "MEDIUM", status: "COMPLETED", daysAgo: 6 },
  ];

  let counter = 0;
  for (const t of sampleTickets) {
    counter += 1;
    const category = categories.find((c) => c.name === t.categoryName)!;
    const vendor = vendors.find((v) => v.name === t.vendorName)!;
    const createdAt = new Date(Date.now() - t.daysAgo * 24 * 60 * 60 * 1000);
    const slaDueAt = new Date(createdAt.getTime() + category.slaHours * 60 * 60 * 1000);
    const ticketNumber = `WFM-${String(counter).padStart(6, "0")}`;

    const existing = await prisma.request.findUnique({ where: { ticketNumber } });
    if (existing) continue;

    await prisma.request.create({
      data: {
        ticketNumber,
        categoryId: category.id,
        vendorId: vendor.id,
        effectiveDate: createdAt,
        description: `Sample ${t.categoryName} request for demo purposes.`,
        teamLeaderName: "Taylor Lead",
        teamLeaderEmail: "taylor.lead@example.com",
        agentName: "Sam Agent",
        agentEmail: "sam.agent@example.com",
        agentId: `AG-${1000 + counter}`,
        priority: t.priority,
        status: t.status,
        createdById: opsUser.id,
        assignedToId: t.status === "PENDING" ? null : wfmUser.id,
        completionDate: t.status === "COMPLETED" ? new Date(createdAt.getTime() + 20 * 60 * 60 * 1000) : null,
        firstResponseAt: t.status === "PENDING" ? null : new Date(createdAt.getTime() + 2 * 60 * 60 * 1000),
        createdAt,
        slaDueAt,
      },
    });
    await prisma.ticketSequence.upsert({ where: { id: 1 }, create: { id: 1, lastValue: counter }, update: { lastValue: counter } });
  }

  // Keep admin referenced to silence unused-var lint while documenting intent.
  void admin;

  console.log("Seed complete.");
  console.log("Login with: admin@wfmportal.com / wfm@wfmportal.com / ops@wfmportal.com  (password: Password123!)");
}

// Allow running directly: `node dist/db/seed.js` (production) or via tsx (local).
if (require.main === module) {
  runSeed()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
