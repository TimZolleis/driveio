import type { DataFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { requireUser } from '~/utils/user/user.server';
import { useLoaderData, useRouteError, useSearchParams } from '@remix-run/react';
import { errors } from '~/messages/errors';
import { prisma } from '../../prisma/db';
import { requireResult } from '~/utils/db/require-result.server';
import { ErrorComponent } from '~/components/ui/ErrorComponent';
import { PageHeader } from '~/components/ui/PageHeader';
import { Label } from '~/components/ui/Label';
import { Calendar } from '~/components/ui/Calendar';
import { useState } from 'react';
import { DateTime, Interval } from 'luxon';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '~/components/ui/Select';
import {
    filterBlockedSlots,
    getAllAvailableSlots,
} from '~/utils/booking/calculate-available-slots';
import { getTimeFromISOString } from '~/utils/luxon/parse-hour-minute';
import { AvailableLessonCard } from '~/components/features/booking/AvailableLessonCard';

function getParameters(request: Request) {
    const url = new URL(request.url);
    const date = url.searchParams.get('date');
    const duration = url.searchParams.get('duration');
    const defaultParameters = {
        date: DateTime.now(),
        duration: '45',
    };
    if (!date || !duration) {
        url.searchParams.set('duration', defaultParameters.duration);
        url.searchParams.set('date', defaultParameters.date.toISO() || new Date().toISOString());
        return {
            requiresRedirect: true,
            date: defaultParameters.date,
            duration: defaultParameters.duration,
            redirect: url.toString(),
        };
    }
    return { requiresRedirect: false, date: DateTime.fromISO(date), duration };
}

export const loader = async ({ request }: DataFunctionArgs) => {
    const user = await requireUser(request);
    if (user.role !== 'STUDENT') {
        throw new Error(errors.user.noPermission);
    }
    const parameters = getParameters(request);
    if (parameters.requiresRedirect) {
        return redirect(parameters.redirect || '/');
    }
    const studentData = await prisma.studentData
        .findUnique({ where: { userId: user.id } })
        .then((result) => requireResult(result, errors.student.noStudentData));

    //Get working start and end time for instructor
    const instructorData = await prisma.instructorData
        .findUnique({ where: { userId: studentData.instructorId || undefined } })
        .then((result) => requireResult(result, errors.instructor.noInstructorData));
    //Get all possible slots based on working time of instructor
    const slots = getAllAvailableSlots(
        instructorData.workStartTime,
        instructorData.workEndTime,
        parseInt(parameters.duration)
    );
    //With all the possible slots, we can now subtract blocked times
    const blockedSlots = await prisma.blocking.findMany({
        where: { userId: instructorData.userId },
    });

    //We'll determine which of them apply today
    const applicableBlockedSlots = blockedSlots.filter((slot) =>
        filterBlockedSlots(slot, parameters.date)
    );
    //After getting all the slots, we have to get all booked lessons for this day to prevent double-booking
    const lessons = await prisma.drivingLesson.findMany({
        where: {
            instructorId: instructorData.userId,
            start: {
                gte: parameters.date.startOf('day').toISO() || undefined,
                lt: parameters.date.startOf('day').plus({ days: 1 }).toISO() || undefined,
            },
        },
    });
    //TODO: Add logic to add waiting time to the first available slot after a lesson
    //TODO: Foolproof and test filtering logic (especially with blocking)
    //NOTE: This logic is still flawed, since it will remove too many lessons out of the grid. Revise logic and instead of removing, calculate lessons until the next boundary and start after the boundary has ended
    //After getting blocked slots and lessons, we can filter them out of the available slots
    const availableSlots = slots
        //The first filter function will filter out blocked slots
        .filter((slot) => {
            return applicableBlockedSlots.some((blockedSlot) => {
                const blockedSlotInterval = Interval.fromDateTimes(
                    getTimeFromISOString(blockedSlot.startDate),
                    getTimeFromISOString(blockedSlot.endDate)
                );
                const slotInterval = Interval.fromDateTimes(
                    getTimeFromISOString(slot.start),
                    getTimeFromISOString(slot.end)
                );
                return !slotInterval.overlaps(blockedSlotInterval);
            });
        })
        //The second filter function will remove lessons
        .filter((slot) => {
            if (lessons.length < 1) {
                return true;
            }
            return lessons.some((lesson) => {
                const slotInterval = Interval.fromDateTimes(
                    DateTime.fromISO(slot.start!),
                    DateTime.fromISO(slot.end!)
                );
                const lessonInterval = Interval.fromDateTimes(
                    DateTime.fromISO(lesson.start),
                    DateTime.fromISO(lesson.end)
                );
                return slotInterval.overlaps(lessonInterval);
            });
        });
    return json({ availableSlots });
};

const BookPage = () => {
    const data = useLoaderData<typeof loader>();
    const [searchParams, setSearchParams] = useSearchParams();
    const date = searchParams.get('date');
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(
        date ? DateTime.fromISO(date).toJSDate() : new Date()
    );
    const duration = searchParams.get('duration');

    const updateDuration = (duration: string) => {
        searchParams.set('duration', duration);
        setSearchParams(searchParams);
    };

    const updateDate = (date: Date | undefined) => {
        if (!date) return;
        setSelectedDate(date);
        searchParams.set('date', date.toISOString());
        setSearchParams(searchParams);
    };

    return (
        <div className={'w-full'}>
            <div className={'w-full flex gap-5'}>
                <div>
                    <PageHeader>Fahrstunden buchen</PageHeader>
                    <p className={'text-muted-foreground'}>
                        Buche hier Fahrstunden für die kommende Woche
                    </p>
                </div>
                <div>
                    <Label>Fahrtdauer</Label>
                    <Select
                        onValueChange={(duration) => updateDuration(duration)}
                        defaultValue={duration || '90'}>
                        <SelectTrigger className={'w-[180px]'}>
                            <SelectValue placeholder={'Fahrtdauer auswählen'} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Fahrtdauer</SelectLabel>
                                <SelectItem value='45'>45 Minuten</SelectItem>
                                <SelectItem value='90'>90 Minuten</SelectItem>
                                <SelectItem value='135'>135 Minuten</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className={'flex gap-2 p-3'}>
                <Calendar
                    mode='single'
                    selected={selectedDate}
                    onSelect={updateDate}
                    className='rounded-md'
                />
                <div className={'py-2 w-full'}>
                    <div>
                        <p className={'font-medium'}>Verfügbare Fahrstunden</p>
                        <p className={'text-muted-foreground text-sm'}>
                            {' '}
                            {date
                                ? DateTime.fromISO(date).toLocaleString(DateTime.DATE_HUGE)
                                : 'Bitte wähle ein Datum aus'}
                        </p>
                    </div>
                    <div className={'grid grid-cols-2 gap-2 mt-5 '}>
                        {data.availableSlots.map((slot) => (
                            <AvailableLessonCard key={slot.index} slot={slot} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ErrorBoundary = () => {
    const error = useRouteError();
    return <ErrorComponent error={error}></ErrorComponent>;
};
export default BookPage;
