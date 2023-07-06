import type { DataFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import * as React from 'react';
import { useState } from 'react';
import { requireUser } from '~/utils/user/user.server';
import { useLoaderData, useRouteError, useSearchParams } from '@remix-run/react';
import { errors } from '~/messages/errors';
import { prisma } from '../../prisma/db';
import { requireResult } from '~/utils/db/require-result.server';
import { ErrorComponent } from '~/components/ui/ErrorComponent';
import { PageHeader } from '~/components/ui/PageHeader';
import { Label } from '~/components/ui/Label';
import { Calendar } from '~/components/ui/Calendar';
import { DateTime } from 'luxon';
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
    findAvailableSlots,
} from '~/utils/booking/calculate-available-slots.server';
import { AvailableLessonCard } from '~/components/features/booking/AvailableLessonCard';
import { zfd } from 'zod-form-data';
import { timeFormatSchema } from '~/routes/_app.me.blocked-slots.add';
import { setTimeOnDate } from '~/utils/luxon/parse-hour-minute';
import { getInstructor } from '~/utils/user/student-data';
import { findLessons, requestLesson } from '~/utils/lesson/lesson.server';
import { isSlotAvailable } from '~/utils/booking/verify-slot.server';
import { z } from 'zod';

async function checkRoutePermission(request: Request) {
    const user = await requireUser(request);
    if (user.role !== 'STUDENT') {
        throw new Error(errors.user.noPermission);
    }
    return user;
}

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

//TODO: Maybe put in separate function and use defer
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
    //Let's get all the instructor's blocked slots
    const blockedSlots = await prisma.blockedSlot.findMany({
        where: { userId: instructorData.userId },
    });

    //We'll determine which of them apply today
    const applicableBlockedSlots = blockedSlots.filter((slot) =>
        filterBlockedSlots(slot, parameters.date)
    );
    //After getting all the slots, we have to get all booked lessons for this day to prevent double-booking
    const lessons = await findLessons({
        instructorId: instructorData.userId,
        date: parameters.date,
    });
    //Now we can find all available slots that we can offer to the student
    const availableSlots = findAvailableSlots({
        workStart: instructorData.workStartTime,
        workEnd: instructorData.workEndTime,
        slotDuration: parseInt(parameters.duration),
        blockedSlots: applicableBlockedSlots,
        bookedLessons: lessons,
        waitingTimeAfterLesson: studentData.waitingTime,
    });
    return json({ availableSlots });
};

const bookSlotSchema = zfd.formData({
    slotStart: zfd.text(timeFormatSchema),
    slotEnd: zfd.text(timeFormatSchema),
    description: zfd.text(z.string().optional()),
});
export const action = async ({ request, params }: DataFunctionArgs) => {
    console.log('Action called');
    const user = await checkRoutePermission(request);
    const parameters = getParameters(request);
    const { slotStart, slotEnd, description } = bookSlotSchema.parse(await request.formData());
    const slotStartDate = setTimeOnDate(slotStart, parameters.date);
    const slotEndDate = setTimeOnDate(slotEnd, parameters.date);
    const instructor = await getInstructor(user);
    if (
        !(await isSlotAvailable({
            date: parameters.date,
            start: slotStartDate,
            end: slotEndDate,
            instructorId: instructor.id,
        }))
    ) {
        throw new Error(errors.slot.overbooked);
    }
    await requestLesson({
        start: slotStartDate,
        end: slotEndDate,
        userId: user.id,
        instructorId: instructor.id,
        description,
    });
    return redirect('/');
};

const BookPage = () => {
    const { availableSlots } = useLoaderData<typeof loader>();
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
                    <div className={'grid grid-cols-2 grid-flow-row-dense gap-2 mt-5 '}>
                        {availableSlots.map((slot, index) => (
                            <React.Fragment key={index}>
                                <AvailableLessonCard slot={slot}></AvailableLessonCard>
                            </React.Fragment>
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
