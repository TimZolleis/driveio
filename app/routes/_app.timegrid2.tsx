import { DateTime, Interval } from 'luxon';
import React from 'react';
import { useHourRange } from '~/utils/hooks/timegrid';
import { requireRole } from '~/utils/user/user.server';
import { ROLE } from '.prisma/client';
import { findWeeklyLessons } from '~/models/lesson.server';
import type { DataFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import useMeasure from 'react-use-measure';

export const loader = async ({ request }: DataFunctionArgs) => {
    const user = await requireRole(request, ROLE.INSTRUCTOR);
    const lessons = await findWeeklyLessons({
        instructorId: user.id,
        start: DateTime.now(),
    });
    return json({ lessons });
};

const testAppointment = {
    name: 'Tim Zolleis',
    start: '2023-07-08T08:00:00.000+02:00',
    end: '2023-07-08T09:50:00.000+02:00',
};

const TimeGridHeader = ({ interval }: { interval: Interval }) => {
    return interval.splitBy({ day: 1 }).map((day) => (
        <th
            key={day.start?.weekday}
            className={'border px-4 py-2 font-medium font-inter text-left'}>
            <p>{day.start?.toLocaleString({ weekday: 'short' })}</p>
            <p className={'text-sm text-muted-foreground font-normal'}>
                {day?.start?.toLocaleString(DateTime.DATE_FULL)}
            </p>
        </th>
    ));
};

const TimeGridPage = () => {
    const { lessons } = useLoaderData<typeof loader>();
    const week = Interval.fromDateTimes(
        DateTime.now().startOf('week'),
        DateTime.now().endOf('week')
    );
    const range = useHourRange(6, 20);
    const [tableRef, { width }] = useMeasure();
    const [appointmentRef, { height }] = useMeasure();
    const hourHeight = height / range.length;
    const getDurationInMinutes = (start: string, end: string) => {
        const startDateTime = DateTime.fromISO(start);
        const endDateTime = DateTime.fromISO(end);
        return endDateTime.diff(startDateTime).as('minute');
    };

    const getHeight = (duration: number) => {
        const height = (hourHeight / 60) * duration;
        return `${height}px`;
    };

    const getStartOffset = (start: string) => {
        const startDateTime = DateTime.fromISO(start);
        const diff = startDateTime.diff(range[0].set({ day: startDateTime.day })).as('minute');
        return (hourHeight / 60) * diff;
    };

    return (
        <div className='p-2 rounded-md relative'>
            <table className='w-full table-fixed rounded-md border-none'>
                <thead>
                    <tr>
                        <th className={'w-[60px]'}></th>
                        <TimeGridHeader interval={week} />
                    </tr>
                </thead>
                <tbody className={'relative'} ref={tableRef}>
                    <tr
                        data-role={'appointment-container'}
                        ref={appointmentRef}
                        style={{ width: `${width - 60}px`, marginLeft: '60px' }}
                        className={'absolute h-full grid grid-cols-7 z-0'}>
                        <td
                            className={'relative m-0 p-0'}
                            style={{
                                gridColumnStart: 2,
                            }}>
                            <div
                                className={
                                    'px-2 py-y bg-indigo-500/20 text-indigo-500 absolute w-full'
                                }
                                style={{
                                    height: getHeight(
                                        getDurationInMinutes(
                                            testAppointment.start,
                                            testAppointment.end
                                        )
                                    ),
                                    transform: `translateY(${getStartOffset(
                                        testAppointment.start
                                    )}px)`,
                                }}>
                                {testAppointment.name}
                            </div>
                        </td>
                        <td
                            style={{
                                transform: `translateY(${getStartOffset(testAppointment.start)}px)`,
                                gridColumnStart: 2,
                                height: getHeight(
                                    getDurationInMinutes(testAppointment.start, testAppointment.end)
                                ),
                            }}
                            className={' abpx-2 py-y bg-indigo-500/20 text-indigo-500'}>
                            {testAppointment.name}
                        </td>
                    </tr>

                    {range.map((date) => (
                        <tr key={date.hour} className={'z-10'}>
                            <td
                                className={
                                    'font-normal text-muted-foreground text-sm flex items-start -translate-y-3'
                                }>
                                {date.toLocaleString({ hour: '2-digit' })}
                            </td>
                            {week.splitBy({ day: 1 }).map((day) => {
                                return (
                                    <td
                                        onClick={() =>
                                            console.log(day.start?.day, date.toFormat('HH:mm'))
                                        }
                                        key={day.start?.weekday}
                                        className='border h-[40px] hover:bg-gray-200 z-10'>
                                        <div className={'grid grid-rows-4 w-full h-full'}></div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TimeGridPage;
