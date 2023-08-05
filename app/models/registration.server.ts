import type { User } from '.prisma/client';
import { prisma } from '../../prisma/db';
import { getRandomCode } from '~/utils/general-utils';

export async function createRegistration(user: User) {
    const code = getRandomCode(6);
    return prisma.registration.create({
        data: {
            userId: user.id,
            code,
        },
    });
}
