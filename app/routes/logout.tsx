import { DataFunctionArgs, redirect } from '@remix-run/node';
import { destroySession, getSession } from '~/utils/session/session.server';

export const loader = async ({ request, params }: DataFunctionArgs) => {
    return redirect('/', {
        headers: {
            'Set-Cookie': await destroySession(request),
        },
    });
};
