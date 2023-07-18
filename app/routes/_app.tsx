import { AppLayout } from '~/components/features/AppLayout';
import { Outlet, useLoaderData, useRouteError } from '@remix-run/react';
import { ErrorComponent } from '~/components/ui/ErrorComponent';
import * as React from 'react';
import { getUser } from '~/utils/user/user.server';
import type { DataFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { ROLE } from '.prisma/client';
import { InstructorLayout } from '~/components/features/InstructorLayout';

export const loader = async ({ request }: DataFunctionArgs) => {
    const user = await getUser(request);
    return json({ user });
};

const AppLayoutPage = () => {
    const { user } = useLoaderData<typeof loader>();
    return (
        <AppLayout>
            {user && user.role === ROLE.INSTRUCTOR ? (
                <InstructorLayout user={user}>
                    <Outlet />
                </InstructorLayout>
            ) : (
                <div className={'p-5'}>
                    <Outlet />
                </div>
            )}
        </AppLayout>
    );
};

export const ErrorBoundary = () => {
    const error = useRouteError();
    return (
        <AppLayout>
            <ErrorComponent error={error}></ErrorComponent>
        </AppLayout>
    );
};

export default AppLayoutPage;
