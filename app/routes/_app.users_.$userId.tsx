import { SidebarNav } from '~/components/features/SideNavigation';
import { Link, Outlet, useLoaderData, Await } from '@remix-run/react';
import { getFullName } from '~/utils/hooks/user';
import type { DataFunctionArgs } from '@remix-run/node';
import { defer } from '@remix-run/node';
import { requireParameter } from '~/utils/general-utils';
import { prisma } from '../../prisma/db';
import { requireResult } from '~/utils/db/require-result.server';
import { Suspense } from 'react';
import { Separator } from '~/components/ui/Seperator';
import { ChevronLeft } from 'lucide-react';
import type { User } from '.prisma/client';
import { requireUserWithPermission } from '~/utils/user/permissions.server';
import { cn } from '~/utils/css';

const sidebarNavItems = (user?: User) => [
    {
        title: 'Generell',
        href: 'edit',
        show: true,
    },
    {
        title: 'Stammdaten',
        href: 'data',
        show: true,
    },
    {
        title: 'Registrierung',
        href: 'registration',
        show: true,
    },
    {
        title: 'Berechtigungen',
        href: 'permissions',
        show: user?.admin || false,
    },
];
export const loader = async ({ request, params }: DataFunctionArgs) => {
    const managementUser = await requireUserWithPermission(request, 'users.view');
    const userId = requireParameter('userId', params);
    const user = await prisma.user
        .findUnique({ where: { id: userId } })
        .then(requireResult)
        .catch();
    return defer({ user, managementUser });
};

const UserDetailsPage = () => {
    const { user, managementUser } = useLoaderData<typeof loader>();
    return (
        <div className={''}>
            <div className={'space-y-6 pb-6 px-6'}>
                <div className='space-y-0.5 mb-6'>
                    <div className={'flex items-center text-brand-800'}>
                        <ChevronLeft size={18} />
                        <Link to={'/users'}>Alle Benutzer</Link>
                    </div>
                    <h2 className='text-2xl font-bold tracking-tight'>Benutzer bearbeiten</h2>
                    <Suspense
                        fallback={<div className={'w-60 h-10 bg-gray-100 rounded-full'}></div>}>
                        <Await resolve={user}>
                            {(user) => (
                                <div className={'flex items-center gap-2'}>
                                    <p className='text-muted-foreground'>{getFullName(user)}</p>
                                    <div
                                        className={cn(
                                            'rounded-md py-1 px-2 max-w-max text-xs',
                                            user.enabled
                                                ? 'bg-green-500/20 text-green-500'
                                                : 'bg-amber-500/20 text-amber-500'
                                        )}>
                                        {user.enabled ? 'Aktiv' : 'Deaktiviert'}
                                    </div>
                                </div>
                            )}
                        </Await>
                    </Suspense>
                </div>
                <Separator className='my-6 ' />
            </div>
            <div className={'px-6 flex flex-col lg:flex-row lg:gap-10'}>
                <SidebarNav items={sidebarNavItems(managementUser)}></SidebarNav>
                <Outlet />
            </div>
        </div>
    );
};
export default UserDetailsPage;
