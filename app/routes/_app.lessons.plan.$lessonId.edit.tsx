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
import { useActionData, useLoaderData } from '@remix-run/react';
import type { ValidationErrors } from '~/types/general-types';
import { EditLessonForm } from '~/components/features/lesson/EditLessonForm';
import { requireParameter } from '~/utils/general-utils';
import { findLesson } from '~/models/lesson.server';
import { requireResult } from '~/utils/db/require-result.server';
import { timeFormatSchema } from '~/routes/_app.me.blocked-slots.add';
import { DateTime } from 'luxon';
import { getSafeISOStringFromDateTime, setTimeOnDate } from '~/utils/luxon/parse-hour-minute';

export const loader = async ({ request, params }: DataFunctionArgs) => {
    const user = await requireRole(request, ROLE.INSTRUCTOR);
    const lessonId = requireParameter('lessonId', params);
    const lesson = await findLesson(lessonId).then(requireResult);
    return json({ lesson });
};

const editLessonSchema = zfd.formData({
    start: zfd.text(timeFormatSchema),
    end: zfd.text(timeFormatSchema),
    date: zfd.text(),
    description: zfd.text(z.string().optional()),
});

export const action = async ({ request, params }: DataFunctionArgs) => {
    const user = await requireRole(request, ROLE.INSTRUCTOR);
    const lessonId = requireParameter('lessonId', params);
    try {
        const data = editLessonSchema.parse(await request.formData());
        const date = DateTime.fromISO(data.date);
        const start = setTimeOnDate(data.start, date);
        const end = setTimeOnDate(data.end, date);
        await prisma.drivingLesson.update({
            where: {
                id: lessonId,
            },
            data: {
                start: getSafeISOStringFromDateTime(start),
                end: getSafeISOStringFromDateTime(end),
                description: data.description,
            },
        });
    } catch (error) {
        if (error instanceof ZodError) {
            return json({ formValidationErrors: error.formErrors.fieldErrors });
        }

        if (error instanceof Error) {
            return json({ error: error.message });
        }

        return json({ error: errors.unknown });
    }

    return redirect('/lessons/plan');
};

const EditLessonPage = () => {
    const { lesson } = useLoaderData<typeof loader>();
    const navigate = useNavigate();
    const onClose = () => {
        navigate('/lessons/plan');
    };

    const validationErrors = useActionData<ValidationErrors>();

    return (
        <Modal open={true} onClose={onClose}>
            <Card className={'border-none shadow-none p-0'}>
                <div className={'grid gap-2'}>
                    <CardTitle>Fahrstunde bearbeiten</CardTitle>
                    <CardDescription>
                        Hier kann eine Fahrstunde bearbeitet werden. Durch die Bearbeitung wird
                        keine automatische Bestätigung durchgeführt.
                    </CardDescription>
                </div>
                <div className={'mt-4'}>
                    <EditLessonForm lesson={lesson} errors={validationErrors} />
                </div>
            </Card>
        </Modal>
    );
};

export default EditLessonPage;
