import type { DataFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { requireRole } from '~/utils/user/user.server';
import { ROLE } from '.prisma/client';
import { getQuery } from '~/utils/general-utils';
import { findWeeklyLessons } from '~/models/lesson.server';
import { DateTime, Interval } from 'luxon';
import type { ShouldRevalidateFunction } from '@remix-run/react';
import { Form, Outlet, useLoaderData } from '@remix-run/react';
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
import { motion } from 'framer-motion';
import { cn } from '~/utils/css';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getSafeISOStringFromDateTime } from '~/utils/luxon/parse-hour-minute';
import {
    findAllBlockedSlots,
    findDailyBlockedSlots,
    findWeeklyBlockedSlots,
} from '~/models/blocked-slot.server';

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
    const currentIntervalStart = session.get('currentIntervalStart')
        ? DateTime.fromISO(session.get('currentIntervalStart') as string)
        : DateTime.now();
    console.log(session.get('currentIntervalStart'));
    const lessons = await findWeeklyLessons({
        instructorId: user.id,
        start: currentIntervalStart,
    });
    const overlappingGroups = getOverlappingAppointments(
        lessons.filter((lesson) => lesson.status !== LessonStatus.DECLINED)
    );
    const blockedSlots = await findWeeklyBlockedSlots(user.id, currentIntervalStart);

    const startISO = getSafeISOStringFromDateTime(currentIntervalStart);
    const endISO = getSafeISOStringFromDateTime(currentIntervalStart.plus({ week: 1 }));

    return json({ lessons, overlappingGroups, viewMode, startISO, endISO, blockedSlots });
};

export const action = async ({ request, params }: DataFunctionArgs) => {
    const formData = await request.formData();
    const session = await getSession(request);
    const viewMode = formData.get('viewMode')?.toString();
    const currentIntervalStart = session.get('currentIntervalStart')
        ? DateTime.fromISO(session.get('currentIntervalStart') as string)
        : DateTime.now().startOf('week');
    const changeIntervalIntent = formData.get('changeIntervalIntent')?.toString();
    if (changeIntervalIntent === 'increment') {
        session.set(
            'currentIntervalStart',
            currentIntervalStart.startOf('week').plus({ week: 1 }).toISO()
        );
    }
    if (changeIntervalIntent === 'decrement') {
        session.set(
            'currentIntervalStart',
            currentIntervalStart.startOf('week').minus({ week: 1 }).toISO()
        );
    }
    session.set('viewMode', viewMode);
    return json(
        { forceRevalidation: true },
        { headers: { 'Set-Cookie': await commitSession(session) } }
    );
};

function getInterval(startISO: string, viewMode: ViewMode | undefined) {
    const now = DateTime.fromISO(startISO);
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
    const { lessons, viewMode, startISO, blockedSlots } = useLoaderData<typeof loader>();
    const activeLessons = lessons.filter((lesson) => lesson.status !== LessonStatus.DECLINED);
    const navigate = useNavigate();
    const activeLessonAppointments = activeLessons.map((lesson) => {
        return {
            appointmentId: lesson.id,
            start: DateTime.fromISO(lesson.start),
            end: DateTime.fromISO(lesson.end),
            name: `${lesson.student.firstName} ${lesson.student.lastName}`,
        };
    });

    const blockedSlotAppointments = blockedSlots.map((slot) => {
        return {
            appointmentId: slot.id,
            start: DateTime.fromISO(slot.startDate),
            end: DateTime.fromISO(slot.endDate),
            name: 'Blockierter Zeitraum',
            variant: 'disabled',
        };
    });

    const interval = getInterval(startISO, viewMode);

    return (
        <>
            <Outlet />
            <Form method={'post'} className={'flex items-center gap-2 pt-2'}>
                <motion.button
                    name={'changeIntervalIntent'}
                    value={'decrement'}
                    whileTap={{ scale: 0.9 }}
                    className={cn(
                        'p-1 rounded-md border shadow-sm opacity-100 hover:cursor-pointer'
                    )}>
                    <ChevronLeft className={cn('w-5 h-5')} />
                </motion.button>
                <motion.button
                    name={'changeIntervalIntent'}
                    value={'increment'}
                    whileTap={{ scale: 0.9 }}
                    className={cn(
                        'p-1 rounded-md border shadow-sm opacity-100 hover:cursor-pointer'
                    )}>
                    <ChevronRight className={cn('w-5 h-5')} />
                </motion.button>
            </Form>
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
                        appointments={[...activeLessonAppointments, ...blockedSlotAppointments]}
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
