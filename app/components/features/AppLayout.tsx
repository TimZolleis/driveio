import type { ReactNode } from 'react';
import { Header } from '~/components/features/Header';
import { Ban, Building2, List, LogOut, Plus, Settings, UserCheck, Users } from 'lucide-react';
import { Separator } from '~/components/ui/Seperator';
import { useOptionalUser } from '~/utils/hooks/user';
import type { User } from '.prisma/client';
import { Form, Link } from '@remix-run/react';
import { ROLE } from '.prisma/client';
import { useState } from 'react';
import { cn } from '~/utils/css';
import { BottomNavigation } from '~/components/features/nav/BottomNavigation';
import { getBookingLink } from '~/utils/general-utils';

const instructorLinks = [
    {
        name: 'Fahrstunden',
        href: '/lessons',
        icon: <List className={'w-4 h-4'} />,
        requiredAdmin: false,
    },
    {
        name: 'Benutzer',
        href: '/users',
        icon: <Users className={'w-4 h-4'} />,
        requiredAdmin: false,
    },
    {
        name: 'Fahrlehrer-Übersicht',
        href: '/instructor-overview',
        icon: <UserCheck className={'w-4 h-4'} />,
        requiredAdmin: true,
    },
];

const studentLinks = [
    {
        name: 'Übersicht',
        href: '/',
        icon: <List className={'w-4 h-4'} />,
        requiredAdmin: false,
    },
    {
        name: 'Fahrstunden buchen',
        href: getBookingLink(),
        icon: <Plus className={'w-4 h-4'} />,
        requiredAdmin: false,
    },
];

const profileLinks = [
    {
        name: 'Profil',
        href: '/me',
        icon: <Settings className={'w-4 h-4'} />,
        requiredAdmin: false,
        roles: [ROLE.INSTRUCTOR, ROLE.STUDENT, ROLE.MANAGEMENT],
    },
    {
        name: 'Blockierungen',
        href: '/me/blocked-slots',
        icon: <Ban className={'w-4 h-4'} />,
        requiredAdmin: false,
        roles: [ROLE.INSTRUCTOR],
    },
    {
        name: 'Fahrschule',
        href: '/driving-school',
        icon: <Building2 className={'w-4 h-4'} />,
        requiredAdmin: true,
        roles: [ROLE.INSTRUCTOR],
    },
];

export const AppLayout = ({ children, user }: { children: ReactNode; user?: User }) => {
    const [showNavigation, setShowNavigation] = useState(false);

    return (
        <main className={'font-inter text-base font-normal'}>
            <main className={'flex'}>
                <div
                    className={cn(
                        'fixed z-10 flex h-full w-full flex-col border-r border-stone-200 bg-stone-100 p-4 transition-all dark:border-stone-700 dark:bg-stone-900 sm:w-60 sm:translate-x-0 font-medium text-sm transform',
                        showNavigation ? 'translate-x-0' : '-translate-x-full'
                    )}>
                    <Link
                        to={'/'}
                        className={'text-dodger-blue-700 font-semibold text-xl pb-2 pl-3'}>
                        drive.io
                    </Link>
                    <Separator className={'mb-6'} />
                    <div className={'h-full flex-col justify-between'}>
                        {user?.role === 'INSTRUCTOR' &&
                            instructorLinks.map((link) => (
                                <SideBarLink key={link.href} to={link.href} icon={link.icon}>
                                    {link.name}
                                </SideBarLink>
                            ))}
                        {user?.role === 'STUDENT' &&
                            studentLinks.map((link) => (
                                <SideBarLink key={link.href} to={link.href} icon={link.icon}>
                                    {link.name}
                                </SideBarLink>
                            ))}

                        <Separator className={'my-6'} />
                        {profileLinks.map((link) =>
                            (link.requiredAdmin && !user?.admin) ||
                            !user ||
                            !link.roles.includes(user.role) ? null : (
                                <SideBarLink key={link.href} to={link.href} icon={link.icon}>
                                    {link.name}
                                </SideBarLink>
                            )
                        )}
                    </div>
                    <div className={'w-full border-t p-2 flex items-center justify-between'}>
                        <div className={'flex items-center gap-1'}>
                            <p>{user?.firstName}</p>
                            <p>{user?.lastName}</p>
                        </div>
                        <Form method={'post'} action={'/logout'}>
                            <button className={'rounded-full p-2 hover:bg-stone-200'}>
                                <LogOut className={'h-5 w-5 text-stone-600'} />
                            </button>
                        </Form>
                    </div>
                </div>
                {user?.role === ROLE.STUDENT && <BottomNavigation />}
                <div className={cn('w-full', showNavigation ? 'pl-60 ' : 'sm:pl-60')}>
                    <div className={'px-5 w-full py-5'}>{children}</div>
                </div>
            </main>
        </main>
    );
};

export const SideBarLink = ({
    to,
    icon,
    children,
}: {
    to: string;
    icon: ReactNode;
    children: ReactNode;
}) => {
    const Comp = icon;
    return (
        <Link
            to={to}
            className={
                'flex items-center gap-2 p-2 rounded-md hover:bg-stone-200 select-none text-gray-800'
            }>
            {icon}
            {children}
        </Link>
    );
};
