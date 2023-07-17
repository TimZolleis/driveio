import type { DataFunctionArgs, V2_MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { checkIfUserSetupComplete, getUser } from '~/utils/user/user.server';
import { Outlet, useLoaderData } from '@remix-run/react';
import { PageHeader } from '~/components/ui/PageHeader';
import { HorizontalNav } from '~/components/features/nav/HorizontalNav';
import { SidebarNav } from '~/components/features/SideNavigation';

export const meta: V2_MetaFunction = () => {
    return [{ title: 'New Remix App' }, { name: 'description', content: 'Welcome to Remix!' }];
};

export const loader = async ({ request }: DataFunctionArgs) => {
    const user = await getUser(request);

    return json({ user });
};

const drivingSchoolNavigation = [
    {
        title: 'Generell',
        href: '',
        show: true,
    },
    {
        title: 'Führerscheinklassen',
        href: 'lesson-settings',
        show: true,
    },
    {
        title: 'Klassenspezifische Einstellungen',
        href: 'class-settings',
        show: true,
    },
];

const Index = () => {
    const data = useLoaderData<typeof loader>();
    return (
        <>
            <PageHeader>Fahrschuleinstellungen</PageHeader>
            <div className={'flex flex-col xl:flex-row items-start mt-4 gap-10 px-6'}>
                <SidebarNav items={drivingSchoolNavigation} />
                <Outlet />
            </div>
        </>
    );
};
export default Index;
