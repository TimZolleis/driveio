import type { DataFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { requireRole } from '~/utils/user/user.server';
import { ROLE } from '.prisma/client';
import { getQuery, raise } from '~/utils/general-utils';
import { DateTime, Interval } from 'luxon';
import { findWeeklyLessons } from '~/models/lesson.server';
import { Label } from '~/components/ui/Label';
import { LessonPlanningDurationSelector } from '~/components/features/lesson/LessonPlanningDurationSelector';
import { Outlet, useLoaderData } from '@remix-run/react';
import { getSafeISOStringFromDateTime } from '~/utils/luxon/parse-hour-minute';
import { filterLessonByWeekday } from '~/components/features/lesson/LessonOverview';
import { LessonCard } from '~/components/features/lesson/LessonCard';
import {
    calculateTotalDrivingTime,
    getOverlappingLessons,
    sortLessonsAscending,
} from '~/utils/lesson/lesson-utils';
import { LessonStatus } from '@prisma/client';
import { Badge } from '~/components/ui/Badge';
import { findInstructorData } from '~/models/instructor-data.server';
import { requireResult } from '~/utils/db/require-result.server';

export const loader = async ({ request, params }: DataFunctionArgs) => {
    const user = await requireRole(request, ROLE.INSTRUCTOR);
    const start = getQuery(request, 'start');
    const startDate = start
        ? DateTime.fromISO(start).startOf('week')
        : DateTime.now().startOf('week');
    const lessons = await findWeeklyLessons({ instructorId: user.id, start: startDate });
    const instructorData = await findInstructorData(user.id).then(requireResult);
    const activeLessons = lessons.filter((lesson) => lesson.status !== LessonStatus.DECLINED);
    const overlappingLessons = getOverlappingLessons(activeLessons);

    return json({
        lessons,
        overlappingLessons,
        start: getSafeISOStringFromDateTime(startDate),
        instructorData,
    });
};

export const action = async ({ request, params }: DataFunctionArgs) => {
    return null;
};

const PlanLessonsPage = () => {
    const { lessons, overlappingLessons, start, instructorData } = useLoaderData<typeof loader>();
    const startDate = DateTime.fromISO(start);
    const week = Interval.fromDateTimes(startDate, startDate.endOf('week').minus({ day: 2 }))
        .splitBy({ day: 1 })
        .map((split) => split.start ?? raise('Error parsing interval'));
    const activeLessons = lessons.filter((lesson) => lesson.status !== LessonStatus.DECLINED);
    const hasExceededLimit = (weekday: number) => {
        const drivingTime = calculateTotalDrivingTime(
            filterLessonByWeekday(activeLessons, weekday)
        );
        return drivingTime > instructorData.dailyDrivingMinutes;
    };

    const highlightableLesson = (weekday: number) => {
        const lessons = filterLessonByWeekday(activeLessons, weekday);
        return lessons.sort(sortLessonsAscending).pop();
    };

    return (
        <>
            <Outlet />
            <div className={'mt-4 space-y-2'}>
                <Label>Planungszeitraum</Label>
                <LessonPlanningDurationSelector />
            </div>
            <div className={'space-y-4 p-4 mt-4 rounded-md border'}>
                {week.map((day) => (
                    <div key={day.day}>
                        <div className={'flex items-center gap-2'}>
                            <Label>{day.toLocaleString(DateTime.DATE_HUGE)}</Label>
                            <Badge
                                variant={'secondary'}
                                className={hasExceededLimit(day.weekday) ? 'text-red-500' : ''}>
                                {calculateTotalDrivingTime(
                                    filterLessonByWeekday(activeLessons, day.weekday)
                                )}{' '}
                                Minuten
                            </Badge>
                        </div>
                        <div className={'space-y-2 mt-2'}>
                            {filterLessonByWeekday(lessons, day.weekday, true).map((lesson) => (
                                <LessonCard
                                    overlaps={
                                        !!overlappingLessons.find(
                                            (overlappingLesson) =>
                                                overlappingLesson.id === lesson.id
                                        )
                                    }
                                    highlight={
                                        hasExceededLimit(day.weekday) &&
                                        highlightableLesson(day.weekday)?.id === lesson.id
                                    }
                                    enablePlanning={true}
                                    key={lesson.id}
                                    lesson={lesson}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};
export default PlanLessonsPage;
