import type { DataFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { requireUser } from '~/utils/user/user.server';
import { prisma } from '../../prisma/db';
import { DateTime } from 'luxon';
import { Link, Outlet, useLoaderData, useSearchParams } from '@remix-run/react';
import { Separator } from '~/components/ui/Seperator';
import { BookedLessonCard } from '~/components/features/booking/BookedLessonCard';
import { requireResult } from '~/utils/db/require-result.server';
import { getQuery, raise } from '~/utils/general-utils';
import { errors } from '~/messages/errors';
import { getLocationByCoordinates } from '~/utils/bing-maps';
import type { LessonViewOption } from '~/components/features/booking/LessonViewOptions';
import { LessonViewOptions } from '~/components/features/booking/LessonViewOptions';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/Alert';
import { CircleBackslashIcon } from '@radix-ui/react-icons';
import { buttonVariants } from '~/components/ui/Button';
import { cn } from '~/utils/css';
import { Card, CardContent } from '~/components/ui/Card';
import { Plus } from 'lucide-react';
import { PageHeader } from '~/components/ui/PageHeader';

export const loader = async ({ request, params }: DataFunctionArgs) => {
    const user = await requireUser(request);
    const showExpired = getQuery(request, 'showExpiredLessons');

    const lessons = await prisma.drivingLesson.findMany({
        where: {
            userId: user.id,
            start: {
                gte:
                    DateTime.now()
                        .startOf(showExpired ? 'week' : 'day')
                        .toISO() ?? undefined,
            },
            status: 'REQUESTED' || 'CONFIRMED',
        },
    });

    const lessonsWithInstructor = await Promise.all(
        lessons.map(async (lesson) => {
            const instructor = await prisma.user
                .findUnique({ where: { id: lesson.instructorId } })
                .then(requireResult);
            return { lesson, instructor };
        })
    );
    const studentData =
        (await prisma.studentData.findUnique({ where: { userId: user.id } })) ??
        raise(errors.student.noStudentData);
    const pickupLocation = await getLocationByCoordinates(
        studentData.pickupLat,
        studentData.pickupLng
    ).then((res) => res.data);

    return json({ user, lessonsWithInstructor, studentData, pickupLocation });
};

export const action = async ({ request, params }: DataFunctionArgs) => {
    return null;
};

const StudentIndexPage = () => {
    const { user, lessonsWithInstructor, studentData, pickupLocation } =
        useLoaderData<typeof loader>();
    return (
        <>
            <h3 className={'font-semibold text-2xl'}>Hallo, {user.firstName}!</h3>
            <Separator className={'my-2'} />
            <div>
                <div className={'flex items-center gap-5'}>
                    <div>
                        <PageHeader>Meine Fahrstunden</PageHeader>
                        <p className={'text-muted-foreground text-sm'}>
                            ({DateTime.now().startOf('week').toLocaleString(DateTime.DATE_MED)} -{' '}
                            {DateTime.now().endOf('week').toLocaleString(DateTime.DATE_MED)})
                        </p>
                    </div>
                </div>
                <div className={'grid gap-4 mt-4'}>
                    {lessonsWithInstructor.length < 1 && <NoLessons />}
                    {lessonsWithInstructor
                        .sort((a, b) => a.lesson.start.localeCompare(b.lesson.start))
                        .map((lessonWithInstructor) => (
                            <BookedLessonCard
                                key={lessonWithInstructor.lesson.id}
                                lesson={lessonWithInstructor.lesson}
                                instructor={lessonWithInstructor.instructor}
                                studentData={studentData}
                                pickupLocation={pickupLocation}
                            />
                        ))}
                </div>
            </div>
            <Outlet />
        </>
    );
};

const NoLessons = () => {
    return (
        <Card className={'shadow-none'}>
            <CardContent className={'flex flex-col items-center w-full'}>
                <img
                    className={'max-w-[200px]'}
                    src='https://illustrations.popsy.co/amber/surreal-hourglass.svg'
                    alt=''
                />
                <p className={'text-xl text-primary font-semibold'}>Keine Fahrstunden</p>
                <p className={'text-muted-foreground text-sm'}>
                    Du hast diese Woche noch keine Fahrstunden gebucht
                </p>
                <Link to={'/book'} className={cn(buttonVariants(), 'mt-2')}>
                    <Plus className={'w-4 h-4'}></Plus>
                    <p>Buchen</p>
                </Link>
            </CardContent>
        </Card>
    );
};

export default StudentIndexPage;
