import type { DataFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { zfd } from 'zod-form-data';
import { z } from 'zod';
import { requireRole } from '~/utils/user/user.server';
import { prisma } from '../../prisma/db';
import { ROLE } from '.prisma/client';
import { Modal } from '~/components/ui/Modal';
import { Card, CardDescription, CardTitle } from '~/components/ui/Card';
import { useNavigate } from 'react-router';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import type { ValidationErrorActionData } from '~/types/general-types';
import { EditLessonForm } from '~/components/features/lesson/EditLessonForm';
import { handleActionError, handleModalIntent, requireParameter } from '~/utils/general-utils';
import { declineLesson, findLesson } from '~/models/lesson.server';
import { requireResult } from '~/utils/db/require-result.server';
import { timeFormatSchema } from '~/routes/_app.me.blocked-slots.add';
import { DateTime } from 'luxon';
import { getSafeISOStringFromDateTime, setTimeOnDate } from '~/utils/luxon/parse-hour-minute';
import { Button } from '~/components/ui/Button';

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
    const formData = await request.formData();
    const intent = handleModalIntent(formData, '/lessons');
    try {
        const data = editLessonSchema.parse(formData);
        switch (intent) {
            case 'decline': {
                await declineLesson({
                    lessonId,
                    cancelledById: user.id,
                    description: data.description || null,
                });
                break;
            }
            case 'save': {
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
                break;
            }
        }
    } catch (error) {
        return handleActionError(error);
    }

    return redirect('/lessons');
};

const EditLessonPage = () => {
    const { lesson } = useLoaderData<typeof loader>();
    const navigate = useNavigate();
    const onClose = () => {
        navigate('/lessons');
    };

    const actionData = useActionData<ValidationErrorActionData>();

    return (
        <Modal open={true} onClose={() => console.log('OnClose')}>
            <Card className={'border-none shadow-none p-0'}>
                <div className={'grid gap-2'}>
                    <CardTitle>Fahrstunde bearbeiten</CardTitle>
                    <CardDescription>
                        Hier kann eine Fahrstunde bearbeitet werden. Durch die Bearbeitung wird
                        keine automatische Bestätigung durchgeführt.
                    </CardDescription>
                </div>
                <div className={'mt-4'}>
                    <Form method={'POST'}>
                        <EditLessonForm lesson={lesson} errors={actionData?.formValidationErrors} />
                        <div className={'flex gap-3 justify-between mt-5'}>
                            <Button name={'intent'} value={'decline'} variant={'destructive'}>
                                Fahrstunde absagen
                            </Button>
                            <div className={'flex gap-3'}>
                                <Button name={'intent'} value={'cancel'} variant={'secondary'}>
                                    Abbrechen
                                </Button>
                                <Button name={'intent'} value={'save'}>
                                    Speichern
                                </Button>
                            </div>
                        </div>
                    </Form>
                </div>
            </Card>
        </Modal>
    );
};

export default EditLessonPage;
