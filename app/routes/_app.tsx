import { AppLayout } from '~/components/features/AppLayout';
import { Outlet } from '@remix-run/react';

const AppLayoutPage = () => {
    return (
        <AppLayout>
            <Outlet />
        </AppLayout>
    );
};

export default AppLayoutPage;