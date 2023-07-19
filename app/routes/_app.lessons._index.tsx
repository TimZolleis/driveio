import type { DataFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { requireRole } from '~/utils/user/user.server';
import { ROLE } from '.prisma/client';
import { getQuery } from '~/utils/general-utils';
import { findWeeklyLessons } from '~/models/lesson.server';
import { DateTime, Interval } from 'luxon';
import type { ShouldRevalidateFunction } from '@remix-run/react';
import { Outlet, useLoaderData } from '@remix-run/react';
import { LessonStatus } from '@prisma/client';
import type { ViewMode } from '~/components/features/lesson/LessonOverviewDaySelector';
import { LessonOverviewDaySelector } from '~/components/features/lesson/LessonOverviewDaySelector';
import { getOverlappingAppointments } from '~/utils/lesson/lesson-utils';
import React from 'react';
import {
    TimeGridTable,
    TimeGridTableAppointmentSelector,
    TimeGridTableContent,
    TimeGridTableHead,
} from '~/components/ui/TableTimeGrid';
import { getHourRange } from '~/utils/hooks/timegrid';
import { useNavigate } from 'react-router';
import { commitSession, getSession } from '~/utils/session/session.server';

export const shouldRevalidate: ShouldRevalidateFunction = ({
    actionResult,
    defaultShouldRevalidate,
}) => {
    if (actionResult?.type === 'data' && actionResult.data?.forceRevalidation) {
        return true;
    }
    return defaultShouldRevalidate;
};

export const loader = async ({ request, params }: DataFunctionArgs) => {
    const user = await requireRole(request, ROLE.INSTRUCTOR);
    const session = await getSession(request);
    const viewMode = session.get('viewMode') as ViewMode | undefined;
    const start = getQuery(request, 'startDate');
    const lessons = await findWeeklyLessons({
        instructorId: user.id,
        start: start ? DateTime.fromISO(start) : DateTime.now(),
    });
    const overlappingGroups = getOverlappingAppointments(
        lessons.filter((lesson) => lesson.status !== LessonStatus.DECLINED)
    );

    return json({ lessons, overlappingGroups, viewMode });
};

export const action = async ({ request, params }: DataFunctionArgs) => {
    const formData = await request.formData();
    const session = await getSession(request);
    const viewMode = formData.get('viewMode')?.toString();
    session.set('viewMode', viewMode);
    return json(
        { forceRevalidation: true },
        { headers: { 'Set-Cookie': await commitSession(session) } }
    );
};

function getInterval(viewMode: ViewMode | undefined) {
    const now = DateTime.now();
    switch (viewMode) {
        case 'monday':
            return Interval.fromDateTimes(
                now.startOf('week').plus({ days: 0 }),
                now.startOf('week').plus({ days: 1 })
            );
        case 'tuesday':
            return Interval.fromDateTimes(
                now.startOf('week').plus({ days: 1 }),
                now.startOf('week').plus({ days: 2 })
            );
        case 'wednesday':
            return Interval.fromDateTimes(
                now.startOf('week').plus({ days: 2 }),
                now.startOf('week').plus({ days: 3 })
            );
        case 'thursday':
            return Interval.fromDateTimes(
                now.startOf('week').plus({ days: 3 }),
                now.startOf('week').plus({ days: 4 })
            );
        case 'friday':
            return Interval.fromDateTimes(
                now.startOf('week').plus({ days: 4 }),
                now.startOf('week').plus({ days: 5 })
            );

        default:
            return Interval.fromDateTimes(now.startOf('week'), now.endOf('week'));
    }
}

const LessonOverviewPage = () => {
    const { lessons, viewMode } = useLoaderData<typeof loader>();
    const activeLessons = lessons.filter((lesson) => lesson.status !== LessonStatus.DECLINED);
    const navigate = useNavigate();
    const appointments = activeLessons.map((lesson) => {
        return {
            appointmentId: lesson.id,
            start: DateTime.fromISO(lesson.start),
            end: DateTime.fromISO(lesson.end),
            name: `${lesson.student.firstName} ${lesson.student.lastName}`,
        };
    });

    const interval = getInterval(viewMode);

    return (
        <>
            <Outlet />
            <div className={'grid gap-4 md:grid-cols-2 lg:grid-cols-4'}></div>
            <div className={'sm:overflow-hidden rounded-md'}>
                <div className={'overflow-scroll md:overflow-hidden'}>
                    <LessonOverviewDaySelector viewMode={viewMode}></LessonOverviewDaySelector>
                </div>
            </div>
            <div className={'mt-4'}>
                <TimeGridTable>
                    <TimeGridTableHead interval={interval} />
                    <TimeGridTableContent
                        startHour={6}
                        endHour={20}
                        interval={interval}
                        appointments={appointments}
                        onAppointmentClick={(appointment) =>
                            navigate(`${appointment.appointmentId}/edit`)
                        }>
                        <TimeGridTableAppointmentSelector
                            interval={interval}
                            hours={getHourRange(6, 20)}
                            onAppointmentSelection={(date, time) =>
                                navigate(
                                    `add?time=${encodeURIComponent(time)}&date=${encodeURIComponent(
                                        date
                                    )}`
                                )
                            }
                        />
                    </TimeGridTableContent>
                </TimeGridTable>
            </div>
        </>
    );
};

export default LessonOverviewPage;
