import { prisma } from '../../prisma/db';

export async function findBlockedSlots(userId: string) {
    return prisma.blockedSlot.findMany({ where: { userId } });
}
