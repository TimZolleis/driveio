import { prisma } from '../../prisma/db';

export async function findStudentData(userId: string, require?: boolean) {
    return prisma.studentData.findUnique({ where: { userId } });
}
