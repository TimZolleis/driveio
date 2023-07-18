import type { DataFunctionArgs, LinksFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import {
    Links,
    LiveReload,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
    useLoaderData,
    useRouteError,
} from '@remix-run/react';

import stylesheet from '~/tailwind.css';
import { getUser } from '~/utils/user/user.server';
import type { Toast } from '~/utils/flash/toast.server';
import { getToastMessage } from '~/utils/flash/toast.server';
import * as React from 'react';
import { useEffect } from 'react';
import { useToast } from '~/components/ui/use-toast';
import { ErrorComponent } from '~/components/ui/ErrorComponent';
import { commitSession, destroySession, getSession } from '~/utils/session/session.server';
import { DateTime } from 'luxon';
import { findUser } from '~/models/user.server';
import { toast, Toaster } from 'sonner';

export const links: LinksFunction = () => [{ rel: 'stylesheet', href: stylesheet }];

export const loader = async ({ request }: DataFunctionArgs) => {
    const user = await getUser(request);
    if (!user) {
        if (request.url.includes('login')) {
            const { header, toastMessage } = await getToastMessage(request);
            return json({ user, toastMessage }, { headers: { 'Set-Cookie': header } });
        }
        if (request.url.includes('register')) {
            const { header, toastMessage } = await getToastMessage(request);
            return json({ user, toastMessage }, { headers: { 'Set-Cookie': header } });
        } else {
            return redirect('/login');
        }
    }
    const session = await getSession(request);
    if (
        !session.get('revalidateAt') ||
        DateTime.fromISO(session.get('revalidateAt')) < DateTime.now()
    ) {
        const revalidatedUser = await findUser(user.id);
        if (
            !revalidatedUser ||
            !revalidatedUser.enabled ||
            user.password !== revalidatedUser.password
        ) {
            return redirect('/login', {
                headers: {
                    'Set-Cookie': await destroySession(request),
                },
            });
        }
        session.set('revalidateAt', DateTime.now().plus({ minutes: 30 }).toISO());
        session.set('user', revalidatedUser);
    }
    const toastMessage = session.get('toast') as Toast | undefined;
    const commitSessionHeader = await commitSession(session);
    return json({ user, toastMessage }, { headers: { 'Set-Cookie': commitSessionHeader } });
};

export default function App() {
    const { toastMessage } = useLoaderData<typeof loader>();

    useEffect(() => {
        if (toastMessage) {
            toast(toastMessage.title, { description: toastMessage.description });
        }
    }, [toastMessage]);

    return (
        <html lang='en'>
            <head>
                <meta charSet='utf-8' />
                <meta name='viewport' content='width=device-width,initial-scale=1' />
                <Meta />
                <Links />
            </head>
            <body>
                <Toaster closeButton={true} />
                <Outlet />
                <ScrollRestoration />
                <Scripts />
                <LiveReload />
            </body>
        </html>
    );
}
