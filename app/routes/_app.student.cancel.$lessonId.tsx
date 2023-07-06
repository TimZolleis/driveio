import type { DataFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { AlertModal } from '~/components/ui/AlertModal';
import { raise, requireParameter } from '~/utils/general-utils';
import { prisma } from '../../prisma/db';
import { requireUser } from '~/utils/user/user.server';
import { errors } from '~/messages/errors';
import { DateTime } from 'luxon';
import { CardDescription, CardHeader, CardTitle } from '~/components/ui/Card';
import { useLoaderData, useRouteError } from '@remix-run/react';
import { ErrorComponent } from '~/components/ui/ErrorComponent';
import * as React from 'react';
import { LessonStatus } from '@prisma/client';
import { getSafeISOStringFromDateTime } from '~/utils/luxon/parse-hour-minute';

export const loader = async ({ request, params }: DataFunctionArgs) => {
    const user = await requireUser(request);
    const lessonId = requireParameter('lessonId', params);
    const lesson =
        (await prisma.drivingLesson.findUnique({ where: { id: lessonId } })) ??
        raise(errors.lesson.notFound);
    if (lesson.userId !== user.id) {
        throw new Error(errors.user.noPermission);
    }
    if (DateTime.fromISO(lesson.end) < DateTime.now()) {
        return redirect('/');
    }
    const requiresFee = DateTime.fromISO(lesson.start).diff(DateTime.now()).hours < 24;
    return json({ lesson, requiresFee });
};

export const action = async ({ request, params }: DataFunctionArgs) => {
    const intent = await request.formData().then((formData) => formData.get('intent')?.toString());
    if (!intent || intent === 'cancel') {
        return redirect('/');
    }
    if (intent === 'confirm') {
        //Check permissions again
        const user = await requireUser(request);
        const lessonId = requireParameter('lessonId', params);
        const lesson =
            (await prisma.drivingLesson.findUnique({ where: { id: lessonId } })) ??
            raise(errors.lesson.notFound);
        if (lesson.userId !== user.id) {
            throw new Error(errors.user.noPermission);
        }
        await prisma.drivingLesson.update({
            where: { id: lessonId },
            data: {
                status: LessonStatus.DECLINED,
                cancelledAt: getSafeISOStringFromDateTime(DateTime.now()),
                cancelledBy: user.id,
            },
        });
        return redirect('/');
    }
};
const CancelLessonPage = () => {
    const { lesson, requiresFee } = useLoaderData();
    return (
        <>
            <AlertModal show={true}>
                <CardHeader>
                    <CardTitle>Fahrstunde absagen</CardTitle>
                    <CardDescription>
                        Möchtest du die Fahrstunde am{' '}
                        <span className={'font-medium'}>
                            {DateTime.fromISO(lesson.start).toLocaleString(DateTime.DATE_MED)}
                        </span>{' '}
                        wirklich absagen?
                        {requiresFee && (
                            <>
                                <p className={'font-medium'}>Achtung:</p>
                                <p>
                                    Da du weniger als 24 Stunden vor Beginn absagst, wird ohne
                                    ärztliches Attest der volle Preis der Fahrstunde fällig.{' '}
                                </p>
                            </>
                        )}
                    </CardDescription>
                </CardHeader>
            </AlertModal>
        </>
    );
};

export default CancelLessonPage;

export const ErrorBoundary = () => {
    const error = useRouteError();
    return <ErrorComponent error={error}></ErrorComponent>;
};
