import { prisma } from '../../prisma/db';

export async function findInstructorData(userId?: string) {
    return prisma.instructorData.findUnique({ where: { userId } });
}
