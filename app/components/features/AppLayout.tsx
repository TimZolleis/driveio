import type { ReactNode } from 'react';
import { Navigation } from '~/components/features/Navigation';
import { Ban, Building2, List, Plus, Settings, UserCheck, Users } from 'lucide-react';
import { Separator } from '~/components/ui/Seperator';
import { useOptionalUser } from '~/utils/hooks/user';
import type { User } from '.prisma/client';
import { Link } from '@remix-run/react';
import { ROLE } from '.prisma/client';
import { useState } from 'react';
import { cn } from '~/utils/css';

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
        href: '/book',
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
            <Navigation />
            <main className={'flex pt-[50px]'}>
                <div
                    className={cn(
                        'fixed z-10 flex h-full w-full flex-col justify-between border-r border-stone-200 bg-stone-100 p-4 transition-all dark:border-stone-700 dark:bg-stone-900 sm:w-60 sm:translate-x-0 font-medium text-sm transform',
                        showNavigation ? 'translate-x-0' : '-translate-x-full'
                    )}>
                    <div>
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

                        <div className={'py-5'}>
                            <Separator />
                        </div>
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
                </div>
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
