import { SidebarNav } from '~/components/features/SideNavigation';
import { Link, Outlet, useLoaderData } from '@remix-run/react';
import { getFullName } from '~/utils/hooks/user';
import { DataFunctionArgs, defer } from '@remix-run/node';
import { requireParameter } from '~/utils/general-utils';
import { prisma } from '../../prisma/db';
import { requireResult } from '~/utils/db/require-result.server';
import { Suspense, useRef } from 'react';
import { Await } from 'react-router';
import { Separator } from '~/components/ui/Seperator';
import { ChevronLeft } from 'lucide-react';

const sidebarNavItems = [
    {
        title: 'Generell',
        href: 'edit',
    },
    {
        title: 'Stammdaten',
        href: 'data',
    },
    {
        title: 'Registrierung',
        href: 'registration',
    },
];
export const loader = async ({ request, params }: DataFunctionArgs) => {
    const userId = requireParameter('userId', params);
    const user = prisma.user
        .findUnique({ where: { id: userId } })
        .then(requireResult)
        .catch();
    return defer({ user });
};

const UserDetailsPage = () => {
    const { user } = useLoaderData<typeof loader>();
    return (
        <div className={''}>
            <div className={'space-y-6 pb-6 px-10'}>
                <div className='space-y-0.5 mb-6'>
                    <div className={'flex items-center text-brand-800'}>
                        <ChevronLeft size={18} />
                        <Link to={'/users'}>Alle Benutzer</Link>
                    </div>
                    <h2 className='text-2xl font-bold tracking-tight'>Benutzer bearbeiten</h2>
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
                <SidebarNav items={sidebarNavItems}></SidebarNav>
                <Outlet />
            </div>
        </div>
    );
};
export default UserDetailsPage;
