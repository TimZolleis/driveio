import { AppLayout } from '~/components/features/AppLayout';
import { Outlet, useRouteError } from '@remix-run/react';
import { ErrorComponent } from '~/components/ui/ErrorComponent';
import * as React from 'react';

const AppLayoutPage = () => {
    return (
        <AppLayout>
            <Outlet />
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
