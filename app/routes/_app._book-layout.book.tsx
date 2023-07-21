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
import { Suspense, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CSSLoader, Loader } from '~/components/ui/Loader';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '~/components/ui/AlertDialog';
import { Button } from '~/components/ui/Button';
import { zfd } from 'zod-form-data';
import { findInstructorId } from '~/models/instructor.server';
import { getQuery } from '~/utils/general-utils';
import { requestLesson } from '~/models/lesson.server';
import { toast } from 'sonner';

type Slot = {
    start: string;
    end: string;
    id: string;
};

//TODO: Put all this shit in a meaningful function
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
    const loaderId = uuid4();
    console.time(`book-layout-book-loader-${loaderId}`);

    /**
     * First, we require the permission to book a lesson
     */
    const user = await requireUserWithPermission(request, 'lesson.book');
    /**
     * To save some DB queries, we check if the user has selected a duration
     */
    const disabledDays = await getDisabledDays(bookingConfig.start, bookingConfig.end);
    const parameters = verifyParameters(request, disabledDays);

    /**
     * Now that we have a date and a duration, we can check the users and instructors' limits
     */

    //promise that resolves after 3 seconds
    console.timeEnd(`book-layout-book-loader-${loaderId}`);
    const promise = getBigFatPromise(
        user.id,
        parameters.date,
        parseInt(parameters.duration),
        disabledDays
    );
    return defer({ promise });
};

const requestLessonSchema = zfd.formData({
    start: zfd.text(),
    end: zfd.text(),
    intent: zfd.text(),
});
export const action = async ({ request }: DataFunctionArgs) => {
    const { start, end, intent } = requestLessonSchema.parse(await request.formData());
    const user = await requireUserWithPermission(request, 'lesson.book');
    const instructorId = await findInstructorId(user.id);
    const startDateTime = DateTime.fromISO(start);
    const endDateTime = DateTime.fromISO(end);
    const isSlotAvailable = await checkSlotAvailability(user.id, startDateTime, endDateTime);
    if (!isSlotAvailable) {
        throw new Error(errors.slot.overbooked);
    }
    const lesson = await requestLesson({
        start: startDateTime,
        end: endDateTime,
        userId: user.id,
        instructorId,
    });
    return json({
        success: true,
        lesson,
    });
};

function getAppointments(unavailableSlots: Slot[], availableSlots: Slot[]) {
    const unavailableAppointments: Appointment[] = unavailableSlots.map((slot) => {
        return {
            start: DateTime.fromISO(slot.start),
            end: DateTime.fromISO(slot.end),
            appointmentId: slot.id,
            variant: 'disabled',
        };
    });
    const availableAppointments: Appointment[] = availableSlots.map((slot) => {
        return {
            start: DateTime.fromISO(slot.start),
            end: DateTime.fromISO(slot.end),
            appointmentId: slot.id,
            variant: 'available',
            name: 'Verfügbare Fahrstunde',
        };
    });
    return [...unavailableAppointments, ...availableAppointments];
}

const BookPage = () => {
    const { promise } = useLoaderData<typeof loader>();
    const navigate = useNavigate();
    const [showDialog, setShowDialog] = useState(false);
    const [currentAppointment, setCurrentAppointment] = useState<Appointment | undefined>(
        undefined
    );
    const actionData = useActionData();
    const navigation = useNavigation();
    const resetPage = () => {
        setCurrentAppointment(undefined);
        setShowDialog(false);
    };

    useEffect(() => {
        if (actionData?.success) {
            resetPage();
        }
    }, [actionData]);

    return (
        <>
            <Outlet />
            <AnimatePresence>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={'w-full'}>
                    {navigation.state === 'idle' ? (
                        <Suspense fallback={<LoadingAppointmentsContainer />}>
                            <Await resolve={promise}>
                                {({ isAllowedToBook, date, availableSlots, unavailableSlots }) => {
                                    const interval = Interval.fromDateTimes(
                                        DateTime.fromISO(date),
                                        DateTime.fromISO(date).plus({ day: 1 })
                                    );
                                    return (
                                        <div
                                            className={
                                                'flex flex-col items-end lg:items-start lg:flex-row gap-5 '
                                            }>
                                            {isAllowedToBook && availableSlots.length > 0 && (
                                                <div className={'p-4 rounded-md border'}>
                                                    {currentAppointment && (
                                                        <AppointmentDialog
                                                            open={showDialog}
                                                            onOpenChange={(val) => {
                                                                setShowDialog(val);
                                                                setCurrentAppointment(undefined);
                                                            }}
                                                            appointment={currentAppointment}
                                                        />
                                                    )}
                                                    <TimeGridTable>
                                                        <TimeGridTableHead
                                                            hideDays={true}
                                                            interval={interval}
                                                        />
                                                        <TimeGridTableContent
                                                            onAppointmentClick={(appointment) => {
                                                                if (
                                                                    appointment.variant ===
                                                                    'available'
                                                                ) {
                                                                    setCurrentAppointment(
                                                                        appointment
                                                                    );
                                                                    setShowDialog(true);
                                                                }
                                                            }}
                                                            hideCollisions={true}
                                                            startHour={6}
                                                            endHour={20}
                                                            interval={interval}
                                                            appointments={getAppointments(
                                                                unavailableSlots,
                                                                availableSlots
                                                            )}>
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
                                            {(!isAllowedToBook || availableSlots.length === 0) && (
                                                <ErrorCard
                                                    title={'Keine Fahrstunden'}
                                                    description={
                                                        'Heute gibt es keine Fahrstunden mehr - Zeit zu entspannen!'
                                                    }
                                                    image={
                                                        'https://illustrations.popsy.co/amber/digital-nomad.svg'
                                                    }
                                                />
                                            )}
                                        </div>
                                    );
                                }}
                            </Await>
                        </Suspense>
                    ) : (
                        <LoadingAppointmentsContainer />
                    )}
                </motion.div>
            </AnimatePresence>
        </>
    );
};

const AppointmentDialog = ({
    open,
    onOpenChange,
    appointment,
}: {
    appointment: Appointment;
    open: boolean;
    onOpenChange: (val: boolean) => void;
}) => {
    const navigation = useNavigation();
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Fahrstunde buchen</AlertDialogTitle>
                    <AlertDialogDescription>
                        Möchtest du die Fahrstunde am {appointment.start.toFormat('dd.MM.yyyy')} von{' '}
                        {appointment.start.toFormat('HH:mm')} bis{' '}
                        {appointment.end.toFormat('HH:mm')} buchen?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <Form method={'post'}>
                        <input
                            type={'hidden'}
                            name={'start'}
                            value={getSafeISOStringFromDateTime(appointment.start)}
                        />
                        <input
                            type={'hidden'}
                            name={'end'}
                            value={getSafeISOStringFromDateTime(appointment.end)}
                        />
                        <Button
                            className={'w-full'}
                            isLoading={navigation.state === 'submitting'}
                            name={'intent'}
                            value={'confirmLesson'}>
                            Bestätigen
                        </Button>
                    </Form>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
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
