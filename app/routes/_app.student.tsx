import type { DataFunctionArgs } from '@remix-run/node';
import { defer } from '@remix-run/node';
import { requireUser } from '~/utils/user/user.server';
import { prisma } from '../../prisma/db';
import { DateTime } from 'luxon';
import { Await, Outlet, useLoaderData } from '@remix-run/react';
import { Separator } from '~/components/ui/Seperator';
import { LessonCard, LessonCardSkeleton } from '~/components/features/booking/LessonCard';
import { getGreeting, raise } from '~/utils/general-utils';
import { errors } from '~/messages/errors';
import { getLocationByCoordinates } from '~/utils/bing-maps';
import { Suspense } from 'react';
import { ErrorCard } from '~/components/ui/ErrorComponent';
import { PageHeader } from '~/components/ui/PageHeader';

async function findStudentDataWithPickupLocation(userId: string) {
    const studentData =
        (await prisma.studentData.findUnique({ where: { userId } })) ??
        raise(errors.student.noStudentData);
    const pickupLocation = await getLocationByCoordinates(
        studentData.pickupLat,
        studentData.pickupLng
    ).then((res) => res.data);
    return { studentData, pickupLocation };
}

export const loader = async ({ request, params }: DataFunctionArgs) => {
    const user = await requireUser(request);
    const lessonPromise = prisma.drivingLesson.findMany({
        where: {
            userId: user.id,
            start: {
                gte: DateTime.now().toISO() ?? undefined,
            },
            status: 'REQUESTED' || 'CONFIRMED',
        },
        orderBy: {
            start: 'asc',
        },
        include: {
            instructor: true,
            type: true,
        },
    });
    const studentDataPromise = findStudentDataWithPickupLocation(user.id);
    const lessonPromiseWithStudentData = Promise.all([lessonPromise, studentDataPromise]);
    return defer({ user, lessonPromiseWithStudentData });
};

export const action = async ({ request, params }: DataFunctionArgs) => {
    return null;
};

const StudentIndexPage = () => {
    const { user, lessonPromiseWithStudentData } = useLoaderData<typeof loader>();
    return (
        <>
            <PageHeader>{getGreeting(user)}</PageHeader>
            <Separator className={'my-2'} />
            <div>
                <div className={'flex items-center gap-5'}>
                    <div>
                        <h4 className={'font-medium text-lg'}>Meine Fahrstunden</h4>
                        <p className={'text-muted-foreground text-sm'}>
                            ({DateTime.now().startOf('week').toFormat('dd.MM.yyyy')}-
                            {DateTime.now().endOf('week').toFormat('dd.MM.yyyy')})
                        </p>
                    </div>
                </div>
                <div className={'grid gap-4 mt-4'}>
                    <Suspense fallback={<LessonCardSkeleton />}>
                        <Await resolve={lessonPromiseWithStudentData}>
                            {([lessons, { studentData, pickupLocation }]) => (
                                <>
                                    {lessons.length < 1 && (
                                        <ErrorCard
                                            title={'Keine Fahrstunden'}
                                            description={
                                                'Du hast für diesen Zeitraum keine Fahrstunden gebucht.'
                                            }
                                            image={
                                                'https://illustrations.popsy.co/amber/looking-at-the-map.svg'
                                            }
                                        />
                                    )}
                                    {lessons.map((lesson) => (
                                        <LessonCard
                                            type={lesson.type}
                                            key={lesson.id}
                                            lesson={lesson}
                                            instructor={lesson.instructor}
                                            studentData={studentData}
                                            pickupLocation={pickupLocation}
                                        />
                                    ))}
                                </>
                            )}
                        </Await>
                    </Suspense>
                </div>
            </div>
            <Outlet />
        </>
    );
};

export default StudentIndexPage;
