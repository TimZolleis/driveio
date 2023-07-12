import { prisma } from '../../prisma/db';

export async function findUser(userId: string | undefined) {
    return prisma.user.findUnique({ where: { id: userId } });
}

export async function findUserByEmail(email: string) {
    return prisma.user.findUnique({
        where: {
            email,
        },
    });
}