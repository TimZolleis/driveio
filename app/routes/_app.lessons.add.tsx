import type { DataFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { zfd } from 'zod-form-data';
import { z, ZodError } from 'zod';
import { requireManagementPermissions, requireRole, requireUser } from '~/utils/user/user.server';
import { prisma } from '../../prisma/db';
import { Prisma, ROLE } from '.prisma/client';
import { errors } from '~/messages/errors';
import { Modal } from '~/components/ui/Modal';
import { Card, CardDescription, CardTitle } from '~/components/ui/Card';
import { GeneralUserDataForm } from '~/components/features/user/GeneralUserDataForm';
import { useNavigate } from 'react-router';
import { Form, useActionData, useLoaderData, isRouteErrorResponse } from '@remix-run/react';
import type { ValidationErrorActionData } from '~/types/general-types';
import { EditLessonForm } from '~/components/features/lesson/EditLessonForm';
import {
    getQuery,
    handleActionError,
    handleModalIntent,
    requireParameter,
} from '~/utils/general-utils';
import { findLesson } from '~/models/lesson.server';
import { requireResult } from '~/utils/db/require-result.server';
import { timeFormatSchema } from '~/routes/_app.me.blocked-slots.add';
import { DateTime } from 'luxon';
import { getSafeISOStringFromDateTime, setTimeOnDate } from '~/utils/luxon/parse-hour-minute';
import { findStudent, findStudents, findUser } from '~/models/user.server';
import { ModalButtons } from '~/components/ui/ModalButtons';
import { AddLessonForm } from '~/components/features/lesson/AddLessonForm';
import { LessonStatus } from '@prisma/client';
import { Button } from '~/components/ui/Button';

export const loader = async ({ request, params }: DataFunctionArgs) => {
    const user = await requireRole(request, ROLE.INSTRUCTOR);
    const students = await findStudents({ instructorId: user.id });
    console.log(students);
    const time = getQuery(request, 'time');
    const date = getQuery(request, 'date');
    return json({ students, time, date });
};

const addLessonSchema = zfd.formData({
    start: zfd.text(timeFormatSchema),
    duration: zfd.text(),
    date: zfd.text(),
    description: zfd.text(z.string().optional()),
    student: zfd.text(),
});

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

        await prisma.drivingLesson.create({
            data: {
                start: getSafeISOStringFromDateTime(start),
                end: getSafeISOStringFromDateTime(end),
                description: data.description,
                userId: student.id,
                instructorId: user.id,
                status: LessonStatus.CONFIRMED,
            },
        });
    } catch (error) {
        return handleActionError(error);
    }

    return redirect('/lessons');
};

const AddLessonPage = () => {
    const { students, date, time } = useLoaderData<typeof loader>();
    const navigate = useNavigate();
    const onClose = () => {
        navigate('/lessons');
    };

    const actionData = useActionData<ValidationErrorActionData>();

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
                            students={students}
                            time={time || undefined}
                            date={date ? DateTime.fromISO(date) : undefined}
                            errors={actionData?.formValidationErrors}
                        />
                        <ModalButtons cancelText={'Abbrechen'} confirmationText={'Hinzufügen'} />
                    </Form>
                </div>
            </Card>
        </Modal>
    );
};

export default AddLessonPage;
