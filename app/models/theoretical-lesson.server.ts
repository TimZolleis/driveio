import { prisma } from '../../prisma/db';

export async function getTheoreticalLessons() {
    return prisma.theoreticalLesson.findMany();
}
