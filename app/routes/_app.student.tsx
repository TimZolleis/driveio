import type { DataFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { requireUser } from '~/utils/user/user.server';
import { prisma } from '../../prisma/db';
import { DateTime } from 'luxon';
import { Outlet, useLoaderData, useSearchParams } from '@remix-run/react';
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
import { Terminal } from 'lucide-react';

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
    const [checkedOptions, setCheckedOptions] = useState<LessonViewOption[]>([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const changeChecked = (option: LessonViewOption, isChecked: boolean) => {
        if (!isChecked) {
            setCheckedOptions(checkedOptions.filter((checkedOption) => checkedOption !== option));
        } else setCheckedOptions([...checkedOptions, option]);
    };
    useEffect(() => {
        for (const [key] of searchParams.entries()) {
            const isChecked = !!checkedOptions.find((checkedOption) => (checkedOption.value = key));
            if (!isChecked) {
                searchParams.delete(key);
            }
        }
        checkedOptions.forEach((checkedOption) => {
            searchParams.set(checkedOption.value, 'true');
        });
        setSearchParams(searchParams);
    }, [checkedOptions]);

    return (
        <>
            <h3 className={'font-semibold text-2xl'}>Hallo, {user.firstName}!</h3>
            <Separator className={'my-2'} />
            <div>
                <div className={'flex items-center gap-5'}>
                    <div>
                        <h4 className={'font-medium text-lg'}>Meine Fahrstunden</h4>
                        <p className={'text-muted-foreground text-sm'}>
                            ({DateTime.now().startOf('week').toLocaleString(DateTime.DATE_MED)} -{' '}
                            {DateTime.now().endOf('week').toLocaleString(DateTime.DATE_MED)})
                        </p>
                    </div>
                    <LessonViewOptions checked={checkedOptions} setChecked={changeChecked} />
                </div>
                {lessonsWithInstructor.length < 1 && <NoLessonCard />}
                <div className={'grid gap-4 mt-4'}>
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

const NoLessonCard = () => {
    return (
        <div className={'py-4'}>
            <Alert>
                <Terminal className='h-4 w-4' />
                <AlertTitle>Heads up!</AlertTitle>
                <AlertDescription>
                    You can add components to your app using the cli.
                </AlertDescription>
            </Alert>
        </div>
    );
};

export default StudentIndexPage;
