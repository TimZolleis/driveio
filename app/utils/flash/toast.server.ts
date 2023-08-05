import { commitSession, getSession } from '~/utils/session/session.server';
import type { User } from '.prisma/client';
import { json } from '@remix-run/node';

export interface Toast {
    title: string;
    description: string;
    type?: 'success' | 'error';
}

export async function toastMessage(request: Request, { title, description, type }: Toast) {
    const session = await getSession(request);
    session.flash('toast', { title, description, type });
    return commitSession(session);
}

export function toastErrorMessage(request: Request, { errorMessage }: { errorMessage: string }) {
    return toastMessage(request, { title: 'Fehler', description: errorMessage });
}

export async function getToastMessage(request: Request) {
    const session = await getSession(request);
    const toastMessage = session.get('toast') as Toast | undefined;
    const header = await commitSession(session);
    return { toastMessage, header };
}

export async function sendSaveSuccessMessage(request: Request, type: string, user: User) {
    return {
        'Set-Cookie': await toastMessage(request, {
            title: `${type} gespeichert`,
            description: `${type} für ${user.firstName} ${user.lastName} erfolgreich gespeichert`,
        }),
    };
}

export async function getToastMessageHeader(request: Request, { title, description, type }: Toast) {
    return {
        'Set-Cookie': await toastMessage(request, {
            title: title,
            description: description,
            type: type,
        }),
    };
}

export async function sendJsonWithSuccessMessage<T extends Object>(
    request: Request,
    { title, description, type }: Toast,
    data?: T
) {
    return json(data || {}, {
        headers: {
            'Set-Cookie': await toastMessage(request, { title, description, type }),
        },
    });
}
