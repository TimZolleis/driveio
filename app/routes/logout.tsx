import type { DataFunctionArgs } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { destroySession, getSession } from '~/utils/session/session.server';

//Deprecated - TODO: Remove
export const loader = async ({ request, params }: DataFunctionArgs) => {
    return redirect('/', {
        headers: {
            'Set-Cookie': await destroySession(request),
        },
    });
};

export const action = async ({ request }: DataFunctionArgs) => {
    return redirect('/', {
        headers: {
            'Set-Cookie': await destroySession(request),
        },
    });
};
