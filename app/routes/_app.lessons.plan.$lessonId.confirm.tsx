import type { DataFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { requireRole } from '~/utils/user/user.server';
import { ROLE } from '.prisma/client';
import { requireParameter } from '~/utils/general-utils';
import { findLesson } from '~/models/lesson.server';
import { requireResult } from '~/utils/db/require-result.server';
import { commitSession, getSession } from '~/utils/session/session.server';
import { prisma } from '../../prisma/db';
import { LessonStatus } from '@prisma/client';
import { AlertDialog } from '~/components/ui/AlertDialog';
import type { AlertModalIntent } from '~/components/ui/AlertModal';
import { AlertModal } from '~/components/ui/AlertModal';
import { CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/Card';
import { DateTime } from 'luxon';
import * as React from 'react';
import { useLoaderData } from '@remix-run/react';
import { Checkbox } from '~/components/ui/CheckBox';

export const loader = async ({ request, params }: DataFunctionArgs) => {
    const user = await requireRole(request, ROLE.INSTRUCTOR);
    const lessonId = requireParameter('lessonId', params);
    const lesson = await findLesson(lessonId).then(requireResult);
    const session = await getSession(request);
    const askForLessonConfirmation = session.get('askForLessonConfirmation');
    if (askForLessonConfirmation === undefined || askForLessonConfirmation) {
        return json({ user, lesson });
    }
    await prisma.drivingLesson.update({
        where: { id: lessonId },
        data: { status: LessonStatus.CONFIRMED },
    });
    return redirect('/lessons/plan');
};

export const action = async ({ request, params }: DataFunctionArgs) => {
    const user = await requireRole(request, ROLE.INSTRUCTOR);
    const lessonId = requireParameter('lessonId', params);
    const formData = await request.formData();
    const intent = formData.get('intent') as AlertModalIntent | undefined;
    const doNotAskAgain = formData.get('doNotAskAgain');
    const session = await getSession(request);
    if (doNotAskAgain) {
        session.set('askForLessonConfirmation', false);
    }
    if (intent === 'confirm') {
        await prisma.drivingLesson.update({
            where: { id: lessonId },
            data: { status: LessonStatus.CONFIRMED, cancelledAt: null, cancelledBy: null },
        });
    }
    return redirect('/lessons/plan', {
        headers: {
            'Set-Cookie': await commitSession(session),
        },
    });
};

const ConfirmLessonPage = () => {
    const { lesson } = useLoaderData<typeof loader>();
    return (
        <AlertModal show={true}>
            <CardHeader>
                <CardTitle>Fahrstunde bestätigen</CardTitle>
                <CardDescription>
                    Möchtest du die Fahrstunde am{' '}
                    <span className={'font-medium'}>
                        {DateTime.fromISO(lesson.start).toLocaleString(DateTime.DATE_MED)} mit{' '}
                        {lesson.student.firstName} {lesson.student.lastName}
                    </span>{' '}
                    wirklich bestätigen?
                </CardDescription>
                <div className='flex items-center gap-1'>
                    <Checkbox id='doNotAskAgain' name={'doNotAskAgain'} />
                    <label
                        htmlFor='terms1'
                        className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                        Nicht erneut fragen
                    </label>
                </div>
            </CardHeader>
        </AlertModal>
    );
};

export default ConfirmLessonPage;
