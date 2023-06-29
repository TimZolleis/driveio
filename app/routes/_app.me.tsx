import { DataFunctionArgs, json } from '@remix-run/node';
import { ChevronLeft } from 'lucide-react';
import { Link, Outlet, useLoaderData } from '@remix-run/react';
import { Suspense } from 'react';
import { Await } from 'react-router';
import { getFullName } from '~/utils/hooks/user';
import { Separator } from '~/components/ui/Seperator';
import { SidebarNav } from '~/components/features/SideNavigation';
import { requireManagementPermissions, requireUser } from '~/utils/user/user.server';
import { User } from '.prisma/client';

const sidebarNavItems = (user?: User) => [
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
        <div className={''}>
            <div className={'space-y-6 pb-6 px-10'}>
                <div className='space-y-0.5 mb-6'>
                    <h2 className='text-2xl font-bold tracking-tight'>Meine Daten</h2>
                    <Suspense
                        fallback={<div className={'w-60 h-10 bg-gray-100 rounded-full'}></div>}>
                        <Await resolve={user}>
                            {(user) => <p className='text-muted-foreground'>{getFullName(user)}</p>}
                        </Await>
                    </Suspense>
                </div>
                <Separator className='my-6 ' />
            </div>
            <div className={'px-6 flex gap-10'}>
                <SidebarNav items={sidebarNavItems(user)}></SidebarNav>
                <Outlet />
            </div>
        </div>
    );
};
export default Me;
