import type { DataFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { requireParameter } from '~/utils/general-utils';
import { prisma } from '../../prisma/db';
import { requireResult } from '~/utils/db/require-result.server';
import { getUserData } from '~/utils/user/user.server';
import { useActionData, useLoaderData } from '@remix-run/react';
import { Modal } from '~/components/ui/Modal';
import { useNavigate } from 'react-router';
import { Card, CardDescription, CardTitle } from '~/components/ui/Card';
import { StudentDataForm } from '~/components/features/user/student/StudentDataForm';
import { zfd } from 'zod-form-data';
import { z, ZodError } from 'zod';
import { errors } from '~/messages/errors';
import { TrainingPhase } from '.prisma/client';
import { isStudentData } from '~/utils/user/student-data';
import { Separator } from '~/components/ui/Seperator';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/Alert';
import { AlertTriangle } from 'lucide-react';
import { PendingRegistration } from '~/components/features/user/Registration';
import { getRandomCode } from '~/routes/_app.users.add';
import { PageHeader } from '~/components/ui/PageHeader';

export const loader = async ({ request, params }: DataFunctionArgs) => {
    const userId = requireParameter('userId', params);
    const userWithRegistration = await prisma.user.findUnique({
        where: { id: userId },
        include: { registration: true },
    });

    return json({ userWithRegistration });
};

export const action = async ({ request, params }: DataFunctionArgs) => {
    const formData = await request.formData();
    const intent = formData.get('intent')?.toString();
    if (!intent) return null;
    const user = await prisma.user
        .findUnique({
            where: { id: requireParameter('userId', params) },
            include: { registration: true },
        })
        .then(requireResult);
    switch (intent) {
        case 'regenerate':
            {
                const code = getRandomCode(6);
                await prisma.registration.update({
                    where: { id: user.registration?.id },
                    data: { createdAt: new Date(), code },
                });
            }
            break;
        case 'delete': {
            await prisma.registration.delete({ where: { id: user.registration?.id } });
            break;
        }
    }

    return null;
};

const UserRegistrationPage = () => {
    const { userWithRegistration } = useLoaderData<typeof loader>();

    return (
        <div className={'w-full'}>
            <div>
                <PageHeader>Registrierung</PageHeader>
                <p className='text-sm text-muted-foreground'>
                    Hier kann eine neuer Benutzer eingeladen / sein Passwort zurückgesetzt werden
                </p>
            </div>
            <Separator className={'my-6'} />
            {userWithRegistration?.registration && (
                <div>
                    <Alert>
                        <AlertTriangle className='h-4 w-4' />
                        <AlertTitle>Aktive Einladung</AlertTitle>
                        <AlertDescription>
                            Dieser Benutzer hat eine aktuelle Einladung. Bereits vergebene Codes
                            werden durch eine neue Einladung ungültig.
                        </AlertDescription>
                    </Alert>
                    <div className={'mt-5'}>
                        <PendingRegistration
                            registration={userWithRegistration.registration}></PendingRegistration>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserRegistrationPage;
