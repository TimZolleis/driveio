import { prisma } from '../../prisma/db';

export async function getLessonTypes() {
    return prisma.lessonType.findMany({ orderBy: { name: 'asc' } });
}

export async function findLastLessonType() {
    return prisma.lessonType.findFirst({ orderBy: { index: 'desc' } });
}
