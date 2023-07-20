import type { DataFunctionArgs } from '@remix-run/node';
import { defer, json, redirect } from '@remix-run/node';
import * as React from 'react';
import { Await, useLoaderData, useNavigation, useRouteError } from '@remix-run/react';
import { ErrorCard } from '~/components/ui/ErrorComponent';
import { DateTime, Interval } from 'luxon';
import { findAvailableSlots } from '~/utils/booking/calculate-available-slots.server';
import { getSafeISODate, getSafeISOStringFromDateTime } from '~/utils/luxon/parse-hour-minute';
import { getDisabledDays } from '~/utils/booking/slot.server';
import { verifyParameters } from '~/utils/booking/book.server';
import { findAllBlockedSlots } from '~/models/blocked-slot.server';
import { bookingConfig } from '~/config/bookingConfig';
import { requireUserWithPermission } from '~/utils/user/permissions.server';
import {
    checkInstructorLimits,
    checkStudentLimits,
    convertBlockedSlotToSlot,
    convertLessonToSlot,
    findBlockedLessons,
} from '~/utils/lesson/booking-utils.server';
import type { Appointment } from '~/components/ui/TableTimeGrid';
import {
    TimeGridTable,
    TimeGridTableAppointmentSelector,
    TimeGridTableContent,
    TimeGridTableHead,
} from '~/components/ui/TableTimeGrid';
import { getHourRange } from '~/utils/hooks/timegrid';
import { useNavigate } from 'react-router';
import { errors } from '~/messages/errors';
import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { CSSLoader, Loader } from '~/components/ui/Loader';

async function getBigFatPromise(
    userId: string,
    date: DateTime,
    duration: number,
    disabledDays: string[]
) {
    const { studentData, instructorData, remainingLessonsForStudent } = await checkStudentLimits(
        userId,
        date
    );
    if (remainingLessonsForStudent <= 0) {
        throw new Error(errors.student.limitExceeded);
    }
    const { remainingMinutesForInstructor } = await checkInstructorLimits(
        instructorData.userId,
        date
    );
    if (remainingMinutesForInstructor < duration) {
        throw new Error(errors.instructor.limitExceeded);
    }
    /**
     * After checking if the student and instructor are allowed to have a lesson that day, we can now get blocked and available slots
     */
    const blockedSlots = await findAllBlockedSlots(
        instructorData.userId,
        date.startOf('week'),
        date.endOf('week'),
        date
    );
    /**
     * Now we need to find all lessons that are not confirmed and have a higher hierarchy than the students training phase
     */
    const blockedLessons = await findBlockedLessons(
        instructorData.userId,
        date,
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
        slotDuration: duration,
        waitingTimeAfterLesson: studentData.waitingTime,
        selectedDate: date,
    });

    return {
        date: getSafeISODate(date),
        disabledDays,
        isAllowedToBook: true,
        remainingLessonsForStudent,
        unavailableSlots,
        availableSlots,
    };
}

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

    //promise that resolves after 3 seconds

    const promise = getBigFatPromise(
        user.id,
        parameters.date,
        parseInt(parameters.duration),
        disabledDays
    );
    return defer({ promise });
};

const BookPage = () => {
    const { promise } = useLoaderData<typeof loader>();
    const navigate = useNavigate();
    const navigation = useNavigation();

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={'w-full'}>
            {navigation.state === 'idle' && (
                <Suspense fallback={<LoadingAppointmentsContainer />}>
                    <Await resolve={promise}>
                        {({
                            isAllowedToBook,
                            date,
                            disabledDays,
                            availableSlots,
                            unavailableSlots,
                            remainingLessonsForStudent,
                        }) => {
                            const interval = Interval.fromDateTimes(
                                DateTime.fromISO(date),
                                DateTime.fromISO(date).plus({ day: 1 })
                            );
                            const unavailableAppointments: Appointment[] = unavailableSlots.map(
                                (slot) => {
                                    return {
                                        start: DateTime.fromISO(slot.start),
                                        end: DateTime.fromISO(slot.end),
                                        appointmentId: slot.id,
                                        variant: 'disabled',
                                    };
                                }
                            );
                            const availableAppointments: Appointment[] = availableSlots.map(
                                (slot) => {
                                    return {
                                        start: DateTime.fromISO(slot.start),
                                        end: DateTime.fromISO(slot.end),
                                        appointmentId: slot.id,
                                        variant: 'available',
                                        name: 'Verfügbare Fahrstunde',
                                    };
                                }
                            );

                            const appointments = [
                                ...unavailableAppointments,
                                ...availableAppointments,
                            ];

                            return (
                                <div
                                    className={
                                        'flex flex-col items-end lg:items-start lg:flex-row gap-5 mt-10'
                                    }>
                                    {isAllowedToBook && availableAppointments.length > 0 && (
                                        <div className={'p-4 rounded-md border'}>
                                            <TimeGridTable>
                                                <TimeGridTableHead
                                                    hideDays={true}
                                                    interval={interval}
                                                />
                                                <TimeGridTableContent
                                                    onAppointmentClick={(appointment) => {
                                                        if (appointment.variant === 'available') {
                                                            navigate(
                                                                `confirm?start=${encodeURIComponent(
                                                                    getSafeISOStringFromDateTime(
                                                                        appointment.start
                                                                    )
                                                                )}&end=${encodeURIComponent(
                                                                    getSafeISOStringFromDateTime(
                                                                        appointment.end
                                                                    )
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
                                                        onAppointmentSelection={() =>
                                                            console.log('Select')
                                                        }
                                                    />
                                                </TimeGridTableContent>
                                            </TimeGridTable>
                                        </div>
                                    )}
                                    {(!isAllowedToBook || availableAppointments.length === 0) && (
                                        <ErrorCard
                                            title={'Keine Fahrstunden'}
                                            description={
                                                'Heute gibt es keine Fahrstunden mehr - Zeit zu entspannen!'
                                            }
                                            image={
                                                'https://illustrations.popsy.co/amber/digital-nomad.svg'
                                            }></ErrorCard>
                                    )}
                                </div>
                            );
                        }}
                    </Await>
                </Suspense>
            )}
            {navigation.state === 'loading' && <LoadingAppointmentsContainer />}
        </motion.div>
    );
};

export const ErrorBoundary = () => {
    const error = useRouteError();
    return (
        <motion.div className={'w-full'} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <ErrorCard
                title={'Keine Fahrstunden'}
                description={'Heute gibt es keine Fahrstunden mehr - Zeit zu entspannen!'}
                image={'https://illustrations.popsy.co/amber/digital-nomad.svg'}></ErrorCard>
        </motion.div>
    );
};

const LoadingAppointmentsContainer = () => {
    return (
        <ErrorCard
            title={'Lade Fahrstunden'}
            description={'Verfügbare Fahrstunden werden geladen...'}
            image={'https://illustrations.popsy.co/amber/surreal-hourglass.svg'}>
            <CSSLoader />
        </ErrorCard>
    );
};

export default BookPage;
