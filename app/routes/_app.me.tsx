import type { DataFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Outlet, useLoaderData } from '@remix-run/react';
import { TopNavigation } from '~/components/features/SideNavigation';
import { requireUser } from '~/utils/user/user.server';
import type { User } from '.prisma/client';
import { PageHeader } from '~/components/ui/PageHeader';

const sidebarNavItems = (user?: User) => [
    {
        title: 'Generell',
        href: '',
        show: true,
    },
    {
        title: 'Blockierungen',
        href: 'blocked-slots',
        show: user?.role === 'INSTRUCTOR',
    },
];

export const loader = async ({ request, params }: DataFunctionArgs) => {
    const user = await requireUser(request);
    return json({ user });
};

export const action = async ({ request, params }: DataFunctionArgs) => {
    return null;
};

const Me = () => {
    const { user } = useLoaderData<typeof loader>();
    return (
        <>
            <PageHeader>Meine Daten</PageHeader>
            <div className={'flex flex-col items-start mt-4 gap-5'}>
                <TopNavigation items={sidebarNavItems(user)} />
                <div className={'px-2 w-full'}>
                    <Outlet />
                </div>
            </div>
        </>
    );
};
export default Me;
