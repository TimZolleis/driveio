import type { DataFunctionArgs, LinksFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import {
    Links,
    LiveReload,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
    useLoaderData,
} from '@remix-run/react';

import stylesheet from '~/tailwind.css';
import { getUser } from '~/utils/user/user.server';
import { getToastMessage } from '~/utils/flash/toast.server';
import { Toaster } from '~/components/ui/Toaster';
import { useEffect } from 'react';
import { useToast } from '~/components/ui/use-toast';

export const links: LinksFunction = () => [{ rel: 'stylesheet', href: stylesheet }];

export const loader = async ({ request }: DataFunctionArgs) => {
    const user = await getUser(request);
    const { header, toastMessage } = await getToastMessage(request);
    return json({ user, toastMessage }, { headers: { 'Set-Cookie': header } });
};

export default function App() {
    const { toastMessage } = useLoaderData<typeof loader>();
    const { toast } = useToast();

    useEffect(() => {
        if (toastMessage) {
            toast(toastMessage);
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
                <Toaster />
                <Outlet />
                <ScrollRestoration />
                <Scripts />
                <LiveReload />
            </body>
        </html>
    );
}
