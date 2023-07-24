import { PrismaClient } from '@prisma/client';
import type { Prisma, User } from '.prisma/client';
import { PrismaClientExtends } from '@prisma/client/extension';
function getExtendedClient(client: PrismaClient) {
    return client.$extends({
        model: {
            user: {
                async softDelete(id: User['id']) {
                    await client.user.update({
                        where: { id },
                        data: { deleted: true },
                    });
                },
            },
            drivingLesson: {},
            lessonTypeLicenseClass: {},
        },
        query: {
            user: {
                async findMany({ query, model, operation, args }) {
                    return query({
                        where: {
                            ...args.where,
                            deleted: false,
                        },
                        include: args.include,
                    });
                },
                async findUnique({ query, model, operation, args }) {
                    return query({
                        where: {
                            ...args.where,
                            deleted: false,
                        },
                        include: args.include,
                    });
                },
                async findFirst({ query, args, model, operation }) {
                    return query({
                        where: {
                            ...args.where,
                            deleted: false,
                        },
                        include: args.include,
                    });
                },
            },
        },
    });
}

type ExtendedPrismaClient = ReturnType<typeof getExtendedClient>;
/**
 * Different client types
 */
let internalPrismaClient: PrismaClient;
let prisma: ReturnType<typeof getExtendedClient>;

/**
 * Global declaration to avoid multiple instances of PrismaClient in development
 */
declare global {
    var __db__: PrismaClient;
    var __extendedDb__: ReturnType<typeof getExtendedClient>;
}

if (process.env.NODE_ENV === 'production') {
    internalPrismaClient = new PrismaClient();
    prisma = getExtendedClient(internalPrismaClient);
} else {
    if (!global.__db__) {
        global.__db__ = new PrismaClient();
    }
    if (!global.__extendedDb__) {
        global.__extendedDb__ = getExtendedClient(global.__db__);
    }
    internalPrismaClient = global.__db__;
    prisma = global.__extendedDb__;
    internalPrismaClient.$connect();
}

export { prisma };
