import type { DataFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { requireRole } from '~/utils/user/user.server';
import { ROLE } from '.prisma/client';
import { getQuery } from '~/utils/general-utils';
import { findWeeklyLessons } from '~/models/lesson.server';
import { DateTime } from 'luxon';
import { useLoaderData, useSearchParams } from '@remix-run/react';
import { LessonStatus } from '@prisma/client';
import type { ViewMode } from '~/components/features/lesson/LessonOverviewDaySelector';
import { LessonOverviewDaySelector } from '~/components/features/lesson/LessonOverviewDaySelector';
import { LessonOverview } from '~/components/features/lesson/LessonOverview';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/Card';
import { CircleSlash2 } from 'lucide-react';
import { countIndividualStudents, calculateTotalDrivingTime } from '~/utils/lesson/lesson-utils';

export const loader = async ({ request, params }: DataFunctionArgs) => {
    const user = await requireRole(request, ROLE.INSTRUCTOR);
    const start = getQuery(request, 'startDate');
    const lessons = await findWeeklyLessons({
        instructorId: user.id,
        start: start ? DateTime.fromISO(start) : DateTime.now(),
    });

    return json({ lessons, currentUrl: request.url });
};

export const action = async ({ request, params }: DataFunctionArgs) => {
    return null;
};
function getViewMode(searchParams: URLSearchParams): ViewMode {
    const viewMode = searchParams.get('view') as ViewMode | null;
    return viewMode ?? 'weekly';
}

const LessonOverviewPage = () => {
    const { lessons } = useLoaderData<typeof loader>();
    const activeLessons = lessons.filter((lesson) => lesson.status !== LessonStatus.DECLINED);
    const [searchParams] = useSearchParams();

    return (
        <>
            <div className={'grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4'}>
                <Card>
                    <CardHeader className={'pb-2'}>
                        <CardTitle className='text-sm font-medium'>
                            Wöchentliche Fahrstunden
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className='text-2xl font-bold'>{activeLessons.length}</div>
                        <p className='text-xs text-muted-foreground flex items-center gap-1'>
                            <CircleSlash2 className={'h-3 w-3'}></CircleSlash2>
                            {activeLessons.length / 5} Fahrstunden / Tag
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className={'pb-2'}>
                        <CardTitle className='text-sm font-medium'>
                            Wöchentliche Fahrtzeit
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className='text-2xl font-bold'>
                            {calculateTotalDrivingTime(activeLessons)}
                            min
                        </div>
                        <p className='text-xs text-muted-foreground flex items-center gap-1'>
                            <CircleSlash2 className={'h-3 w-3'}></CircleSlash2>
                            {calculateTotalDrivingTime(activeLessons) / 5}
                            min / Tag
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className={'pb-2'}>
                        <CardTitle className='text-sm font-medium'>
                            Individuelle Fahrschüler
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className='text-2xl font-bold'>
                            {countIndividualStudents(activeLessons)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className={'pb-2'}>
                        <CardTitle className='text-sm font-medium'>Abgesagte Fahrstunden</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className='text-2xl font-bold'>
                            {
                                lessons.filter((lesson) => lesson.status === LessonStatus.DECLINED)
                                    .length
                            }{' '}
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className={'sm:overflow-hidden rounded-md'}>
                <div className={'mt-4 overflow-scroll md:overflow-hidden'}>
                    <LessonOverviewDaySelector></LessonOverviewDaySelector>
                </div>
            </div>
            <div className={'mt-4'}>
                <LessonOverview lessons={activeLessons} viewMode={getViewMode(searchParams)} />
            </div>
        </>
    );
};

export default LessonOverviewPage;
