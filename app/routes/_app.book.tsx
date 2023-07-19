import type { DataFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import * as React from 'react';
import { useState } from 'react';
import { useLoaderData, useRouteError, useSearchParams } from '@remix-run/react';
import { ErrorCard, ErrorComponent } from '~/components/ui/ErrorComponent';
import { PageHeader } from '~/components/ui/PageHeader';
import { DateTime, Interval } from 'luxon';
import { findAvailableSlots } from '~/utils/booking/calculate-available-slots.server';
import { getSafeISODate, getSafeISOStringFromDateTime } from '~/utils/luxon/parse-hour-minute';
import { getDisabledDays } from '~/utils/booking/slot.server';
import { verifyParameters } from '~/utils/booking/book.server';
import { findAllBlockedSlots } from '~/models/blocked-slot.server';
import { bookingConfig } from '~/config/bookingConfig';
import { requireUserWithPermission } from '~/utils/user/permissions.server';
import { Modal } from '~/components/ui/Modal';
import {
    checkInstructorLimits,
    checkStudentLimits,
    convertBlockedSlotToSlot,
    convertLessonToSlot,
    findBlockedLessons,
} from '~/utils/lesson/booking-utils.server';
import { Calendar } from '~/components/ui/Calendar';
import type { Appointment } from '~/components/ui/TableTimeGrid';
import {
    TimeGridTable,
    TimeGridTableAppointmentSelector,
    TimeGridTableContent,
    TimeGridTableHead,
} from '~/components/ui/TableTimeGrid';
import { getHourRange } from '~/utils/hooks/timegrid';
import { useNavigate } from 'react-router';
import { Button } from '~/components/ui/Button';

//TODO: Put all this shit in a big promise and use defer
export const loader = async ({ request }: DataFunctionArgs) => {
    /**
     * First, we require the permission to book a lesson
     */
    const user = await requireUserWithPermission(request, 'lesson.book');
    /**
     * To save some DB queries, we check if the user has selected a duration
     */
    const disabledDays = await getDisabledDays(bookingConfig.start, bookingConfig.end);
    const parameters = await verifyParameters(request, disabledDays);

    /**
     * Now that we have a date and a duration, we can check the users and instructors' limits
     */
    const { studentData, instructorData, remainingLessonsForStudent } = await checkStudentLimits(
        user.id,
        parameters.date
    );
    const { remainingMinutesForInstructor } = await checkInstructorLimits(
        instructorData.userId,
        parameters.date
    );
    if (
        remainingLessonsForStudent === 0 ||
        remainingMinutesForInstructor < parseInt(parameters.duration)
    ) {
        return json({
            date: getSafeISODate(parameters.date),
            disabledDays,
            remainingLessonsForStudent,
            isAllowedToBook: false,
            unavailableSlots: [],
            availableSlots: [],
        });
    }
    /**
     * After checking if the student and instructor are allowed to have a lesson that day, we can now get blocked and available slots
     */
    const blockedSlots = await findAllBlockedSlots(
        instructorData.userId,
        parameters.date.startOf('week'),
        parameters.date.endOf('week'),
        parameters.date
    );
    /**
     * Now we need to find all lessons that are not confirmed and have a higher hierarchy than the students training phase
     */
    const blockedLessons = await findBlockedLessons(
        instructorData.userId,
        parameters.date,
        studentData.trainingPhase
    );
    /**
     * Let's now combine the blocked slots and lessons to an array of unavailable slots
     */
    const unavailableSlots = [
        ...blockedSlots.map(convertBlockedSlotToSlot),
        ...blockedLessons.map(convertLessonToSlot),
    ];
    const availableSlots = findAvailableSlots({
        workStart: instructorData.workStartTime,
        workEnd: instructorData.workEndTime,
        unavailableSlots: unavailableSlots,
        slotDuration: parseInt(parameters.duration),
        waitingTimeAfterLesson: studentData.waitingTime,
        selectedDate: parameters.date,
    });

    return json({
        date: getSafeISODate(parameters.date),
        disabledDays,
        isAllowedToBook: true,
        remainingLessonsForStudent,
        unavailableSlots,
        availableSlots,
    });
};

const BookPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    if (searchParams.get('selectDuration')) {
        return <SetDuration />;
    } else {
        return <SelectLesson />;
    }
};

const SetDuration = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const handleSetDuration = (duration: string) => {
        searchParams.set('duration', duration);
        searchParams.delete('selectDuration');
        setSearchParams(searchParams);
    };

    return (
        <Modal open={true}>
            <div>
                <PageHeader variant={'lg'}>Fahrtdauer</PageHeader>
                <p className={'text-muted-foreground text-sm'}>Wie lange möchtest du fahren?</p>
            </div>
            <div className={'mt-4 grid gap-2 text-center font-medium text-sm'}>
                <div
                    className={'p-3 rounded-md border hover:cursor-pointer'}
                    onClick={() => handleSetDuration('90')}>
                    <p>90 Minuten</p>
                </div>
                <div
                    className={'p-3 rounded-md border hover:cursor-pointer'}
                    onClick={() => handleSetDuration('135')}>
                    <p>135 Minuten</p>
                </div>
            </div>
        </Modal>
    );
};

//TODO: Can we clean up this mess?
const SelectLesson = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const loaderData = useLoaderData<typeof loader>();
    const navigate = useNavigate();
    const date = searchParams.get('date');
    if (!date) {
        searchParams.set('date', getSafeISOStringFromDateTime(DateTime.now()));
        setSearchParams(searchParams);
    }
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(
        date ? DateTime.fromISO(date).toJSDate() : DateTime.now().toJSDate()
    );
    const updateDate = (date: Date | undefined) => {
        if (!date) return;
        setSelectedDate(date);
        searchParams.set('date', getSafeISOStringFromDateTime(DateTime.fromJSDate(date)));
        setSearchParams(searchParams);
    };
    const interval = Interval.fromDateTimes(
        DateTime.fromISO(date!),
        DateTime.fromISO(date!).plus({ day: 1 })
    );
    const unavailableAppointments: Appointment[] = loaderData.unavailableSlots.map((slot) => {
        return {
            start: DateTime.fromISO(slot.start),
            end: DateTime.fromISO(slot.end),
            appointmentId: slot.id,
            variant: 'disabled',
        };
    });
    const availableAppointments: Appointment[] = loaderData.availableSlots.map((slot) => {
        return {
            start: DateTime.fromISO(slot.start),
            end: DateTime.fromISO(slot.end),
            appointmentId: slot.id,
            variant: 'available',
            name: 'Verfügbare Fahrstunde',
        };
    });
    const appointments = [...unavailableAppointments, ...availableAppointments];

    return (
        <div className={'w-full'}>
            <div className={'w-full grid md:flex gap-5'}>
                <div>
                    <PageHeader>Fahrstunden buchen</PageHeader>
                    <p className={'text-sm text-muted-foreground'}>
                        Du kannst diese Woche noch{' '}
                        <span className={'font-semibold text-primary'}>
                            {loaderData.remainingLessonsForStudent} Fahrstunden
                        </span>{' '}
                        buchen
                    </p>
                </div>
            </div>
            <div className={'flex flex-col items-end lg:items-start lg:flex-row gap-5 mt-10'}>
                <div className={'w-full rounded-md p-3 border lg:max-w-sm'}>
                    <Calendar
                        modifiers={{
                            hideDays: {
                                before: DateTime.now().startOf('week').toJSDate(),
                                after: DateTime.now().plus({ week: 1 }).endOf('week').toJSDate(),
                            },
                        }}
                        showOutsideDays={false}
                        modifiersStyles={{ hideDays: { display: 'none' } }}
                        selected={selectedDate}
                        onSelect={updateDate}
                        mode={'single'}
                        fromMonth={DateTime.now().toJSDate()}
                        toMonth={DateTime.now().startOf('week').plus({ week: 2 }).toJSDate()}
                        disabled={loaderData.disabledDays.map((day) =>
                            DateTime.fromISO(day).toJSDate()
                        )}
                    />
                </div>
                {loaderData.isAllowedToBook && availableAppointments.length > 0 && (
                    <div className={'p-4 rounded-md border'}>
                        <TimeGridTable>
                            <TimeGridTableHead hideDays={true} interval={interval} />
                            <TimeGridTableContent
                                onAppointmentClick={(appointment) => {
                                    if (appointment.variant === 'available') {
                                        navigate(
                                            `confirm?start=${encodeURIComponent(
                                                getSafeISOStringFromDateTime(appointment.start)
                                            )}&end=${encodeURIComponent(
                                                getSafeISOStringFromDateTime(appointment.end)
                                            )}`
                                        );
                                    }
                                }}
                                hideCollisions={true}
                                startHour={6}
                                endHour={20}
                                interval={interval}
                                appointments={appointments}>
                                <TimeGridTableAppointmentSelector
                                    interval={interval}
                                    hours={getHourRange(6, 20)}
                                    onAppointmentSelection={() => console.log('Select')}
                                />
                            </TimeGridTableContent>
                        </TimeGridTable>
                    </div>
                )}
                {(!loaderData.isAllowedToBook || availableAppointments.length === 0) && (
                    <ErrorCard
                        title={'Keine Fahrstunden'}
                        description={'Heute gibt es keine Fahrstunden mehr - Zeit zu entspannen!'}
                        image={'https://illustrations.popsy.co/amber/digital-nomad.svg'}>
                        <Button
                            onClick={() => {
                                if (selectedDate) {
                                    const newDate = DateTime.fromJSDate(selectedDate)
                                        .plus({ day: 1 })
                                        .toJSDate();
                                    updateDate(newDate);
                                }
                            }}>
                            Nächster Tag
                        </Button>
                    </ErrorCard>
                )}
            </div>
        </div>
    );
};

export const ErrorBoundary = () => {
    const error = useRouteError();
    return <ErrorComponent error={error}></ErrorComponent>;
};
export default BookPage;
