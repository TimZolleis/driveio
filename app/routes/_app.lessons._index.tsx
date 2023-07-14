import type { DataFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { requireRole } from '~/utils/user/user.server';
import { ROLE } from '.prisma/client';
import { getQuery } from '~/utils/general-utils';
import { findWeeklyLessons } from '~/models/lesson.server';
import { DateTime, Interval } from 'luxon';
import { useLoaderData, useSearchParams } from '@remix-run/react';
import { LessonStatus } from '@prisma/client';
import type { ViewMode } from '~/components/features/lesson/LessonOverviewDaySelector';
import { LessonOverviewDaySelector } from '~/components/features/lesson/LessonOverviewDaySelector';
import { getOverlappingAppointments } from '~/utils/lesson/lesson-utils';
import { Appointment, TimeGrid, TimeGridContent } from '~/components/ui/TimeGrid';
import React from 'react';
import {
    TimeGridTable,
    TimeGridTableAppointmentSelector,
    TimeGridTableContent,
    TimeGridTableHead,
} from '~/components/ui/TableTimeGrid';
import { useHourRange } from '~/utils/hooks/timegrid';

export const loader = async ({ request, params }: DataFunctionArgs) => {
    const user = await requireRole(request, ROLE.INSTRUCTOR);
    const start = getQuery(request, 'startDate');
    const lessons = await findWeeklyLessons({
        instructorId: user.id,
        start: start ? DateTime.fromISO(start) : DateTime.now(),
    });
    const overlappingGroups = getOverlappingAppointments(
        lessons.filter((lesson) => lesson.status !== LessonStatus.DECLINED)
    );

    return json({ lessons, overlappingGroups, currentUrl: request.url });
};

export const action = async ({ request, params }: DataFunctionArgs) => {
    return null;
};
function getViewMode(searchParams: URLSearchParams): ViewMode {
    const viewMode = searchParams.get('view') as ViewMode | null;
    return viewMode ?? 'weekly';
}

const LessonOverviewPage = () => {
    const { lessons, overlappingGroups } = useLoaderData<typeof loader>();
    const activeLessons = lessons.filter((lesson) => lesson.status !== LessonStatus.DECLINED);
    const [searchParams] = useSearchParams();
    const appointments = activeLessons.map((lesson) => {
        return {
            appointmentId: lesson.id,
            start: DateTime.fromISO(lesson.start),
            end: DateTime.fromISO(lesson.end),
            name: `${lesson.student.firstName} ${lesson.student.lastName}`,
        };
    });
    const interval = Interval.fromDateTimes(
        DateTime.now().startOf('week'),
        DateTime.now().endOf('week')
    );

    return (
        <>
            <div className={'grid gap-4 md:grid-cols-2 lg:grid-cols-4'}></div>
            <div className={'sm:overflow-hidden rounded-md'}>
                <div className={'overflow-scroll md:overflow-hidden'}>
                    <LessonOverviewDaySelector></LessonOverviewDaySelector>
                </div>
            </div>
            <div className={'mt-4'}>
                <TimeGridTable>
                    <TimeGridTableHead interval={interval} />
                    <TimeGridTableContent
                        startHour={6}
                        endHour={20}
                        interval={interval}
                        appointments={appointments}>
                        <TimeGridTableAppointmentSelector
                            interval={interval}
                            hours={useHourRange(6, 20)}
                            onAppointmentSelection={() => console.log('Select')}
                        />
                    </TimeGridTableContent>
                </TimeGridTable>
            </div>
        </>
    );
};

export default LessonOverviewPage;
