import { prisma } from '../../prisma/db';
import type { Prisma } from '.prisma/client';
import { ROLE } from '.prisma/client';

export async function findUser(userId: string | undefined, args?: Prisma.UserFindUniqueArgs) {
    return prisma.user.findUnique({ where: { id: userId }, include: { permissions: true } });
}

export async function findUserByEmail(email: string) {
    return prisma.user.findUnique({
        where: {
            email,
        },
    });
}

export async function findStudent({ studentId }: { studentId: string }) {
    return prisma.user.findFirst({ where: { id: studentId, role: ROLE.STUDENT } });
}

export async function findStudents({ instructorId }: { instructorId?: string }) {
    return await prisma.user
        .findMany({
            include: {
                studentData: true,
            },
        })
        .then((result) =>
            instructorId
                ? result.filter((element) => element.studentData?.instructorId === instructorId)
                : result
        );
}
