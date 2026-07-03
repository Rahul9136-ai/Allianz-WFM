import { prisma } from "../config/prisma";

// Generates sequential ticket numbers like WFM-000001 using an atomic counter row.
export async function generateTicketNumber(): Promise<string> {
  const seq = await prisma.ticketSequence.upsert({
    where: { id: 1 },
    create: { id: 1, lastValue: 1 },
    update: { lastValue: { increment: 1 } },
  });
  return `WFM-${String(seq.lastValue).padStart(6, "0")}`;
}
