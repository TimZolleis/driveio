import type { DataFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import * as React from 'react';
import { useState } from 'react';
import { requireRole, requireUser } from '~/utils/user/user.server';
import { useLoaderData, useRouteError, useSearchParams } from '@remix-run/react';
import { errors } from '~/messages/errors';
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
import { findLessons, requestLesson } from '~/models/lesson.server';
import { isSlotAvailable } from '~/utils/booking/verify-slot.server';
import { z } from 'zod';
import { getDisabledDays } from '~/utils/booking/slot.server';
import { verifyParameters } from '~/utils/booking/book.server';
import { ROLE } from '.prisma/client';
import { findStudentData } from '~/models/student-data.server';
import { findInstructorData } from '~/models/instructor-data.server';
import { raise } from '~/utils/general-utils';
import { findBlockedSlots } from '~/models/blocked-slot.server';
import { checkInstructorLimits } from '~/utils/user/instructor/verify-instructor-limits.server';
import { bookingConfig } from '~/config/bookingConfig';
import { checkStudentLimits } from '~/utils/user/student/verify-student-limits-server';

//TODO: Maybe put in separate function and use defer
export const loader = async ({ request }: DataFunctionArgs) => {
    const user = await requireRole(request, ROLE.STUDENT);
    const disabledDays = await getDisabledDays(bookingConfig.start, bookingConfig.end);
    const parameters = await verifyParameters(request, disabledDays);
    if (parameters.requiresRedirect) {
        return redirect(parameters?.redirectUrl || '/');
    }
    const studentData = await findStudentData(user.id, true).then((result) =>
        requireResult(result, errors.student.noStudentData)
    );
    const instructorData = await findInstructorData(
        studentData.instructorId ?? raise(errors.student.noStudentData)
    ).then((result) => requireResult(result, errors.instructor.noInstructorData));
    const blockedSlots = await findBlockedSlots(instructorData.userId).then((slots) =>
        slots.filter((slot) => filterBlockedSlots(slot, parameters.date))
    );
    const lessons = await findLessons({
        instructorId: instructorData.userId,
        date: parameters.date,
    });
    const { studentLimitExceeded, studentLessonsRemaining } = await checkStudentLimits(
        user.id,
        studentData,
        instructorData,
        parameters.date
    );

    const { instructorLimitExceeded, instructorMinutesRemaining } = checkInstructorLimits(
        instructorData,
        lessons,
        parameters.date
    );
    if (
        instructorLimitExceeded ||
        instructorMinutesRemaining < parseInt(parameters.duration) ||
        studentLimitExceeded
    ) {
        return json({ availableSlots: [], disabledDays, studentLessonsRemaining });
    }

    const availableSlots = findAvailableSlots({
        workStart: instructorData.workStartTime,
        workEnd: instructorData.workEndTime,
        slotDuration: parseInt(parameters.duration),
        blockedSlots,
        bookedLessons: lessons,
        waitingTimeAfterLesson: studentData.waitingTime,
    });
    return json({ availableSlots, disabledDays, studentLessonsRemaining });
};

const bookSlotSchema = zfd.formData({
    slotStart: zfd.text(timeFormatSchema),
    slotEnd: zfd.text(timeFormatSchema),
    description: zfd.text(z.string().optional()),
});
export const action = async ({ request, params }: DataFunctionArgs) => {
    const user = await requireRole(request, ROLE.STUDENT);
    const parameters = await verifyParameters(request);
    if (!parameters.verified) {
        throw new Error(errors.slot.notAvailable);
    }
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
    const { availableSlots, disabledDays, studentLessonsRemaining } =
        useLoaderData<typeof loader>();
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
                    <p className={'text-xs text-muted-foreground'}>
                        Du kannst diese Woche noch{' '}
                        <span className={'font-semibold text-primary'}>
                            {studentLessonsRemaining} Fahrstunden
                        </span>{' '}
                        buchen
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
                    disabled={disabledDays.map((day) => DateTime.fromISO(day).toJSDate())}
                    fromMonth={DateTime.now().toJSDate()}
                    toMonth={DateTime.now().startOf('week').plus({ week: 2 }).toJSDate()}
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
