import type { User } from '.prisma/client';
import type { ReactNode } from 'react';
import { Link } from '@remix-run/react';
import { Ban, Building2, List, Settings, User as UserIcon, UserCheck, Users } from 'lucide-react';
import { Separator } from '~/components/ui/Seperator';

export const InstructorLayout = ({ user, children }: { user?: User; children: ReactNode }) => {
    return (
        <main className={'flex'}>
            <div
                className={
                    'border-r w-full sm:w-60 py-10 px-3 font-medium text-sm border-stone-200 bg-stone-100 fixed h-full flex flex-col justify-between'
                }>
                <div>
                    <SideBarLink to={'/lessons'} icon={<List className={'w-4 h-4'} />}>
                        Fahrstunden
                    </SideBarLink>
                    <SideBarLink to={'/users'} icon={<Users className={'w-4 h-4'} />}>
                        Benutzer
                    </SideBarLink>
                    {user?.admin && (
                        <SideBarLink
                            to={'/instructor-overview'}
                            icon={<UserCheck className={'w-4 h-4'} />}>
                            Fahrlehrer-Übersicht
                        </SideBarLink>
                    )}
                    <div className={'py-5'}>
                        <Separator />
                    </div>
                    <SideBarLink to={'/settings'} icon={<Settings className={'w-4 h-4'} />}>
                        Einstellungen
                    </SideBarLink>
                    <SideBarLink to={'/blocked-slots'} icon={<Ban className={'w-4 h-4'} />}>
                        Blockierungen
                    </SideBarLink>
                    {user?.admin && (
                        <SideBarLink
                            to={'/driving-school'}
                            icon={<Building2 className={'w-4 h-4'} />}>
                            Fahrschule
                        </SideBarLink>
                    )}
                </div>
            </div>

            <div className={'pl-60 w-full'}>
                <div className={'px-5 w-full py-5'}>{children}</div>
            </div>
        </main>
    );
};

const SideBarLink = ({
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
