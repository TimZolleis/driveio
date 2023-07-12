import { commitSession, getSession } from '~/utils/session/session.server';

interface Toast {
    title: string;
    description: string;
}

export async function toastMessage(request: Request, { title, description }: Toast) {
    const session = await getSession(request);
    session.flash('toast', { title, description });
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
