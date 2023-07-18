import { requireUser } from '~/utils/user/user.server';
import { prisma } from '../../../prisma/db';
import { json } from '@remix-run/node';
import { errors } from '~/messages/errors';
import { findUser } from '~/models/user.server';
import { requireResult } from '~/utils/db/require-result.server';

export async function requireUserWithPermission(request: Request, permission: string) {
    const user = await requireUser(request);
    if (user.admin) {
        return await findUser(user.id).then((result) => requireResult(result));
    }
    const userWithPermission = await prisma.user.findUnique({
        where: { id: user.id, permissions: { some: { value: permission } } },
        include: { permissions: true },
    });
    if (!userWithPermission) {
        throw json(
            { error: errors.user.noPermission, requiredPermission: permission },
            { status: 403 }
        );
    }
    return userWithPermission;
}
