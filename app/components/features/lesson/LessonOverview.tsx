import type { ViewMode } from '~/components/features/lesson/LessonOverviewDaySelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/Card';
import { Label } from '~/components/ui/Label';
import { Separator } from '~/components/ui/Seperator';
import type { LessonWithStudent } from '~/routes/_app.lessons';
import { DateTime, Interval } from 'luxon';
import { LessonCard } from '~/components/features/lesson/LessonCard';
import { Badge } from '~/components/ui/Badge';
import { calculateTotalDrivingTime } from '~/utils/lesson/lesson-utils';

export function filterLessonByWeekday(
    lessons: LessonWithStudent[],
    weekday: number,
    sort?: boolean
) {
    const filtered = lessons.filter((lesson) => {
        const date = DateTime.fromISO(lesson.start);
        return date.weekday === weekday;
    });
    if (sort) {
        return filtered.sort((a, b) => a.start.localeCompare(b.start));
    }
    return filtered;
}

function parseViewModeToDateTime(viewMode: ViewMode) {
    switch (viewMode) {
        case 'monday': {
            return DateTime.now().set({ weekday: 1 });
        }
        case 'tuesday': {
            return DateTime.now().set({ weekday: 2 });
        }
        case 'wednesday': {
            return DateTime.now().set({ weekday: 3 });
        }
        case 'thursday': {
            return DateTime.now().set({ weekday: 4 });
        }
        case 'friday': {
            return DateTime.now().set({ weekday: 5 });
        }
    }
    return DateTime.now();
}

export const LessonOverview = ({
    lessons,
    viewMode,
}: {
    lessons: LessonWithStudent[];
    viewMode: ViewMode;
}) => {
    const week = Interval.fromDateTimes(
        DateTime.now().startOf('week'),
        DateTime.now().endOf('week').minus({ day: 2 })
    );
    const weekdayOptions = { weekday: 'long' } as const;

    return (
        <Card>
            <CardHeader className={'pb-2'}>
                <CardTitle className={'text-lg'}>Übersicht</CardTitle>
                <CardDescription>
                    {viewMode === 'weekly'
                        ? undefined
                        : parseViewModeToDateTime(viewMode).toLocaleString(DateTime.DATE_HUGE)}
                </CardDescription>
            </CardHeader>
            <CardContent className={'px-3'}>
                {viewMode === 'weekly' && (
                    <div className={'space-y-2'}>
                        {week
                            .splitBy({ day: 1 })
                            .map((split) => split.start)
                            .map((day) => (
                                <div className={'space-y-2'} key={day?.day}>
                                    <div className={'flex items-center gap-2'}>
                                        <Label>
                                            {day?.toLocaleString(weekdayOptions)},{' '}
                                            {day?.toFormat('DD')}
                                        </Label>
                                        <Badge variant={'secondary'}>
                                            {calculateTotalDrivingTime(
                                                filterLessonByWeekday(lessons, day?.weekday || 1)
                                            )}{' '}
                                            Minuten
                                        </Badge>
                                    </div>
                                    <Separator />
                                    {filterLessonByWeekday(lessons, day?.weekday || 1).map(
                                        (lesson) => (
                                            <LessonCard
                                                enablePlanning={false}
                                                key={lesson.id}
                                                lesson={lesson}
                                            />
                                        )
                                    )}
                                </div>
                            ))}
                    </div>
                )}
                {viewMode !== 'weekly' && (
                    <div className={'space-y-2'}>
                        {filterLessonByWeekday(
                            lessons,
                            parseViewModeToDateTime(viewMode).weekday
                        ).map((lesson) => (
                            <LessonCard
                                enablePlanning={false}
                                key={lesson.id}
                                lesson={lesson}></LessonCard>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
