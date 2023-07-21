import type { DataFunctionArgs } from '@remix-run/node';
import { defer, redirect } from '@remix-run/node';
import * as React from 'react';
import { Suspense } from 'react';
import { Await, Form, useLoaderData, useNavigation } from '@remix-run/react';
import { PageHeader } from '~/components/ui/PageHeader';
import { DateTime } from 'luxon';
import { requireUserWithPermission } from '~/utils/user/permissions.server';
import { Modal } from '~/components/ui/Modal';
import { checkSlotAvailability } from '~/utils/lesson/booking-utils.server';
import { getQuery } from '~/utils/general-utils';
import { errors } from '~/messages/errors';
import { Loader } from '~/components/ui/Loader';
import { Button } from '~/components/ui/Button';
import { requestLesson } from '~/models/lesson.server';
import { findInstructorId } from '~/models/instructor.server';

export const loader = async ({ request }: DataFunctionArgs) => {
    const user = await requireUserWithPermission(request, 'lesson.book');
    const start = getQuery(request, 'start');
    const end = getQuery(request, 'end');
    if (!start || !end) {
        throw redirect('/book');
    }
    const startDate = DateTime.fromISO(start);
    const endDate = DateTime.fromISO(end);
    const isSlotAvailable = Promise.all([
        checkSlotAvailability(user.id, startDate, endDate),
        new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
    return defer({ start, end, isSlotAvailable });
};

export const action = async ({ request }: DataFunctionArgs) => {
    const intent = await request.formData().then((formData) => formData.get('intent'));
    if (intent === 'confirm') {
        const user = await requireUserWithPermission(request, 'lesson.book');
        const instructorId = await findInstructorId(user.id);
        const startString = getQuery(request, 'start');
        const endString = getQuery(request, 'end');
        if (!startString || !endString) {
            throw redirect('/book');
        }
        const start = DateTime.fromISO(startString);
        const end = DateTime.fromISO(endString);
        const isSlotAvailable = await checkSlotAvailability(user.id, start, end);
        if (!isSlotAvailable) {
            throw new Error(errors.slot.overbooked);
        }
        const lesson = await requestLesson({ start, end, userId: user.id, instructorId });
    }
    return redirect('/book');
};

const ConfirmBookingPage = () => {
    const { start, end, isSlotAvailable } = useLoaderData<typeof loader>();
    const startDateTime = DateTime.fromISO(start);
    const endDateTime = DateTime.fromISO(end);
    const navigation = useNavigation();

    return (
        <Modal open={true}>
            <div>
                <PageHeader variant={'lg'}>Fahrstunde buchen</PageHeader>
                <p className={'text-muted-foreground text-sm'}>
                    Möchtest du die Fahrstunde am {startDateTime.toFormat('dd.MM.yyyy')} von{' '}
                    {startDateTime.toFormat('HH:mm')} bis {endDateTime.toFormat('HH:mm')} buchen?
                </p>
            </div>
            <div className={'flex flex-col items-center justify-center mt-4'}>
                <Suspense fallback={<LoadingAvailability />}>
                    <Await resolve={isSlotAvailable}>
                        {([isSlotAvailable]) => {
                            if (!isSlotAvailable) {
                                return (
                                    <Form className={'flex items-center justify-between'}>
                                        <Button
                                            name={'intent'}
                                            value={'cancel'}
                                            variant={'secondary'}></Button>
                                        <Button name={'intent'} value={'confirm'}></Button>
                                    </Form>
                                );
                            }
                            return (
                                <Form
                                    method={'post'}
                                    className={'flex items-center justify-end gap-4 w-full'}>
                                    <Button
                                        isLoading={
                                            navigation.state !== 'idle' &&
                                            navigation.formData?.get('intent') == 'cancel'
                                        }
                                        name={'intent'}
                                        value={'cancel'}
                                        variant={'secondary'}>
                                        Abbrechen
                                    </Button>
                                    <Button
                                        isLoading={
                                            navigation.state !== 'idle' &&
                                            navigation.formData?.get('intent') == 'confirm'
                                        }
                                        name={'intent'}
                                        value={'confirm'}>
                                        Bestätigen
                                    </Button>
                                </Form>
                            );
                        }}
                    </Await>
                </Suspense>
            </div>
        </Modal>
    );
};

const LoadingAvailability = () => {
    return (
        <div
            className={
                'rounded-md border gap-3 p-3 w-full flex flex-col items-center justify-center mt-4'
            }>
            <Loader size={25} />
            <p className={'text-muted-foreground text-sm'}>Verfügbarkeit wird überprüft...</p>
        </div>
    );
};

export default ConfirmBookingPage;
