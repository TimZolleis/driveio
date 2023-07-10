import type { DataFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { requireRole } from '~/utils/user/user.server';
import type { DrivingLesson, User } from '.prisma/client';
import { ROLE } from '.prisma/client';
import { DateTime } from 'luxon';
import { Link, Outlet, useLoaderData, useSearchParams } from '@remix-run/react';
import { PageHeader } from '~/components/ui/PageHeader';
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/Tabs';

export interface LessonWithStudent extends DrivingLesson {
    student: User;
}

export const loader = async ({ request, params }: DataFunctionArgs) => {
    const user = await requireRole(request, ROLE.INSTRUCTOR);
    return json({ user, currentUrl: request.url });
};

export const action = async ({ request, params }: DataFunctionArgs) => {
    return null;
};

const LessonPage = () => {
    const { currentUrl } = useLoaderData<typeof loader>();
    const [searchParams] = useSearchParams();
    const start = searchParams.get('start')
        ? DateTime.fromISO(searchParams.get('start')!)
        : DateTime.now();

    return (
        <main>
            <PageHeader>Fahrstunden</PageHeader>
            <p className={'text-muted-foreground text-sm'}>
                {start.startOf('week').toFormat('DD')} -{' '}
                {start.endOf('week').minus({ day: 2 }).toFormat('DD')}
            </p>
            <Tabs
                defaultValue={currentUrl.includes('plan') ? 'plan' : 'overview'}
                className={'mt-4'}>
                <TabsList>
                    <TabsTrigger asChild={true} value={'overview'}>
                        <Link to={'/lessons'}>Übersicht</Link>
                    </TabsTrigger>
                    <TabsTrigger value={'plan'}>
                        <Link to={'/lessons/plan'}>Planen</Link>
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            <Outlet />
        </main>
    );
};

export default LessonPage;
