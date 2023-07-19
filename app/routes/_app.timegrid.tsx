import { DateTime, Interval } from 'luxon';
import React from 'react';
import { requireRole } from '~/utils/user/user.server';
import { ROLE } from '.prisma/client';
import { findWeeklyLessons } from '~/models/lesson.server';
import type { DataFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import {
    TimeGridTable,
    TimeGridTableAppointmentSelector,
    TimeGridTableContent,
    TimeGridTableHead,
} from '~/components/ui/TableTimeGrid';
import { getHourRange } from '~/utils/hooks/timegrid';

export const loader = async ({ request }: DataFunctionArgs) => {
    const user = await requireRole(request, ROLE.INSTRUCTOR);
    const lessons = await findWeeklyLessons({
        instructorId: user.id,
        start: DateTime.now(),
    });
    return json({ lessons });
};

const TimeGridPage = () => {
    const { lessons } = useLoaderData<typeof loader>();
    const interval = Interval.fromDateTimes(
        DateTime.now().startOf('week'),
        DateTime.now().endOf('week')
    );
    const appointments = lessons.map((lesson) => {
        const start = DateTime.fromISO(lesson.start);
        const end = DateTime.fromISO(lesson.end);
        const name = `${lesson.student.firstName} ${lesson.student.lastName}`;
        return { start, end, name };
    });
    const testAppointment1 = {
        appointmentId: '122334444',
        name: 'Tim Zolleis',
        start: DateTime.fromISO('2023-07-14T08:00:00.000+02:00'),
        end: DateTime.fromISO('2023-07-14T09:30:00.000+02:00'),
        disabled: true,
    };
    const testAppointment2 = {
        appointmentId: '122334',
        name: 'Tim Zolleis',
        start: DateTime.fromISO('2023-07-14T10:00:00.000+02:00'),
        end: DateTime.fromISO('2023-07-14T11:30:00.000+02:00'),
        disabled: true,
    };

    const testAppointment3 = {
        appointmentId: '12asdasd2334',
        name: 'Tim Zolleis',
        start: DateTime.fromISO('2023-07-14T12:00:00.000+02:00'),
        end: DateTime.fromISO('2023-07-14T13:30:00.000+02:00'),
        disabled: false,
    };

    const testAppointment4 = {
        appointmentId: '1223asdasd34',
        name: 'Tim Zolleis',
        start: DateTime.fromISO('2023-07-14T14:30:00.000+02:00'),
        end: DateTime.fromISO('2023-07-14T16:00:00.000+02:00'),
        disabled: true,
    };

    return (
        <TimeGridTable>
            <TimeGridTableHead interval={interval} />
            <TimeGridTableContent
                startHour={7}
                endHour={18}
                interval={interval}
                appointments={[
                    testAppointment1,
                    testAppointment2,
                    testAppointment3,
                    testAppointment4,
                ]}>
                <TimeGridTableAppointmentSelector
                    interval={interval}
                    hours={getHourRange(7, 18)}
                    onAppointmentSelection={() => console.log('Select')}
                />
            </TimeGridTableContent>
        </TimeGridTable>
    );
};

export default TimeGridPage;
