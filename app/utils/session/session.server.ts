import type { Session } from '@remix-run/node';
import { createCookieSessionStorage, redirect } from '@remix-run/node';
import { env } from '~/utils/env/env';
import { toastErrorMessage } from '~/utils/flash/toast.server';
import { getUser } from '~/utils/user/user.server';

const {
    getSession: getCookieSession,
    commitSession: commitCookieSession,
    destroySession: destroyCookieSession,
} = createCookieSessionStorage({
    cookie: {
        name: 'driveio-session',
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        secrets: [env.APPLICATION_SECRET],
    },
});

export async function getSession(request: Request) {
    return getCookieSession(request.headers.get('Cookie'));
}

export async function assertAuthSession(
    request: Request,
    { onFailRedirectTo }: { onFailRedirectTo?: string }
) {
    const user = await getUser(request);
    if (!user) {
        throw redirect(onFailRedirectTo || '/login', {
            headers: {
                'Set-Cookie': await toastErrorMessage(request, {
                    errorMessage: 'no-user-session',
                }),
            },
        });
    }
}

export async function commitSession(session: Session) {
    return commitCookieSession(session);
}

export async function destroySession(request: Request) {
    const session = await getSession(request);
    return destroyCookieSession(session);
}
