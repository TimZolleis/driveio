import type { Session } from '@remix-run/node';
import { createCookieSessionStorage } from '@remix-run/node';
import { env } from '~/utils/env/env';

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

export async function commitSession(session: Session) {
    return commitCookieSession(session);
}

export async function destroySession(request: Request) {
    const session = await getSession(request);
    return destroyCookieSession(session);
}
