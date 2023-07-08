import type { ROLE, User } from '.prisma/client';
import pbkdf2 from 'pbkdf2-passworder';
import { commitSession, getSession } from '~/utils/session/session.server';
import { errors } from '~/messages/errors';
import { prisma } from '../../../prisma/db';

export async function checkPassword(user: User, password: string) {
    if (!user.password) {
        throw new Error(errors.user.noPassword);
    }
    return pbkdf2.compare(password, user.password);
}

export async function getUser(request: Request) {
    const session = await getSession(request);
    return session.get('user') as User | undefined;
}

export async function setUser(request: Request, user: User) {
    const session = await getSession(request);
    session.set('user', user);
    return commitSession(session);
}

export async function requireUser(request: Request) {
    const user = await getUser(request);
    if (!user) {
        throw new Error(errors.user.notFound);
    }
    return user;
}

export async function requireManagementPermissions(request: Request) {
    const user = await requireUser(request);
    if (user.role === 'STUDENT') {
        throw new Error('Insufficient Permissions');
    }
    return user;
}

export async function requireRole(request: Request, role: ROLE) {
    const user = await requireUser(request);
    if (user.role !== role) {
        throw new Error(errors.user.noPermission);
    }
    return user;
}

export async function getUserData(user: User) {
    return user.role === 'INSTRUCTOR'
        ? prisma.instructorData.findUnique({ where: { userId: user.id } })
        : user.role === 'MANAGEMENT'
        ? prisma.managementData.findUnique({ where: { userId: user.id } })
        : prisma.studentData.findUnique({ where: { userId: user.id } });
}
