import type { DataFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { zfd } from 'zod-form-data';
import { z } from 'zod';
import { requireRole } from '~/utils/user/user.server';
import { prisma } from '../../prisma/db';
import { ROLE } from '.prisma/client';
import { errors } from '~/messages/errors';
import { Modal } from '~/components/ui/Modal';
import { Card, CardDescription, CardTitle } from '~/components/ui/Card';
import { useNavigate } from 'react-router';
import { Form, useActionData, useLoaderData, useNavigation } from '@remix-run/react';
import type { ValidationErrorActionData } from '~/types/general-types';
import { getQuery, handleActionError, handleModalIntent } from '~/utils/general-utils';
import { timeFormatSchema } from '~/routes/_app.me.blocked-slots.add';
import { DateTime } from 'luxon';
import { getSafeISOStringFromDateTime, setTimeOnDate } from '~/utils/luxon/parse-hour-minute';
import { findStudent, findStudents } from '~/models/user.server';
import { ModalButtons } from '~/components/ui/ModalButtons';
import { AddLessonForm, addLessonSchema } from '~/components/features/lesson/AddLessonForm';
import { LessonStatus } from '@prisma/client';
import { getLessonTypes } from '~/models/lesson-type.server';
import { determineLessonType } from '~/utils/lesson/booking-utils.server';
import { useModalFormState } from '~/utils/hooks/form-state';
import { getToastMessageHeader } from '~/utils/flash/toast.server';

export const loader = async ({ request, params }: DataFunctionArgs) => {
    const user = await requireRole(request, ROLE.INSTRUCTOR);
    const students = await findStudents({ instructorId: user.id });
    const lessonTypes = await getLessonTypes();
    const time = getQuery(request, 'time');
    const date = getQuery(request, 'date');
    return json({ students, time, date, lessonTypes });
};

export const action = async ({ request, params }: DataFunctionArgs) => {
    const user = await requireRole(request, ROLE.INSTRUCTOR);
    const formData = await request.formData();

    try {
        handleModalIntent(formData, '/lessons');
        const data = addLessonSchema.parse(formData);
        const student = await findStudent({ studentId: data.student });
        if (!student) {
            throw new Error(errors.user.notFound);
        }

        const start = setTimeOnDate(data.start, DateTime.fromISO(data.date));
        const end = start.plus({ minute: parseInt(data.duration) });
        const lessonTypeId =
            data.lessonType === 'auto' ? await determineLessonType(student.id) : data.lessonType;

        await prisma.drivingLesson.create({
            data: {
                start: getSafeISOStringFromDateTime(start),
                end: getSafeISOStringFromDateTime(end),
                description: data.description,
                userId: student.id,
                instructorId: user.id,
                status: LessonStatus.CONFIRMED,
                lessonTypeId,
            },
        });
        return redirect('/lessons', {
            headers: {
                ...(await getToastMessageHeader(request, {
                    title: 'Fahrstunde hinzugefügt',
                    description: 'Die Fahrstunde wurde erfolgreich hinzugefügt.',
                })),
            },
        });
    } catch (error) {
        return handleActionError(error);
    }
};

const AddLessonPage = () => {
    const { students, date, time, lessonTypes } = useLoaderData<typeof loader>();
    const actionData = useActionData<ValidationErrorActionData>();
    const formState = useModalFormState();
    return (
        <Modal open={true} onClose={() => console.log('OnClose')}>
            <Card className={'border-none shadow-none p-0'}>
                <div className={'grid gap-2'}>
                    <CardTitle>Fahrstunde hinzufügen</CardTitle>
                    <CardDescription>
                        Hier kann eine Fahrstunde bearbeitet werden. Durch die Bearbeitung wird
                        keine automatische Bestätigung durchgeführt.
                    </CardDescription>
                </div>
                <div className={'mt-4'}>
                    <Form method={'post'}>
                        <AddLessonForm
                            lessonTypes={lessonTypes}
                            students={students}
                            time={time || undefined}
                            date={date ? DateTime.fromISO(date) : undefined}
                            errors={actionData?.formValidationErrors}
                        />
                        <ModalButtons
                            isCancelling={formState.isCancelling}
                            isSaving={formState.isSaving}
                            cancelText={'Abbrechen'}
                            confirmationText={'Hinzufügen'}
                        />
                    </Form>
                </div>
            </Card>
        </Modal>
    );
};

export default AddLessonPage;
