import type { DataFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { requireRole } from '~/utils/user/user.server';
import type { DrivingLesson, User } from '.prisma/client';
import { ROLE } from '.prisma/client';
import { DateTime } from 'luxon';
import { Link, Outlet, useLoaderData, useSearchParams } from '@remix-run/react';
import { PageHeader } from '~/components/ui/PageHeader';
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/Tabs';
import { Badge } from '~/components/ui/Badge';
import { motion } from 'framer-motion';
import { cn } from '~/utils/css';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getSession } from '~/utils/session/session.server';
import { getSafeISOStringFromDateTime } from '~/utils/luxon/parse-hour-minute';
import { Drawer } from 'vaul';

export interface LessonWithStudent extends DrivingLesson {
    student: User;
}

export const loader = async ({ request, params }: DataFunctionArgs) => {
    const user = await requireRole(request, ROLE.INSTRUCTOR);
    const session = await getSession(request);
    const currentIntervalStart =
        session.get('currentIntervalStart') || getSafeISOStringFromDateTime(DateTime.now());
    return json({ user, currentUrl: request.url, currentIntervalStart });
};

const LessonPage = () => {
    const { currentIntervalStart } = useLoaderData<typeof loader>();
    const intervalStart = DateTime.fromISO(currentIntervalStart);
    return (
        <main>
            <PageHeader>Fahrstunden</PageHeader>
            <div className={'flex items-center gap-2'}>
                <Badge variant={'secondary'}>
                    {intervalStart.startOf('week').toFormat('DD')} -{' '}
                    {intervalStart.endOf('week').minus({ day: 2 }).toFormat('DD')}
                </Badge>
                <Badge variant={'secondary'}>KW {intervalStart.weekNumber}</Badge>
            </div>
            <Outlet />
        </main>
    );
};

export default LessonPage;
