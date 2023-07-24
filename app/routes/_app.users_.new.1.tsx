import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { Card, CardDescription, CardHeader, CardTitle } from '~/components/ui/Card';
import type { ActionArgs, DataFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { zfd } from 'zod-form-data';
import type { z } from 'zod';
import { handleActionError, transformErrors } from '~/utils/general-utils';
import { prisma } from '../../prisma/db';
import { errors } from '~/messages/errors';
import { commitSession, getSession } from '~/utils/session/session.server';
import { requireUserWithPermission } from '~/utils/user/permissions.server';
import { PageHeader } from '~/components/ui/PageHeader';
import {
    createUserSchema,
    GeneralUserDataForm,
} from '~/components/features/user/GeneralUserDataForm';
import { Button } from '~/components/ui/Button';
import { ArrowRight } from 'lucide-react';
import type { ValidationErrorActionData } from '~/types/general-types';
import type { studentDataSchema } from '~/components/features/user/student/StudentDataForm';
import type { instructorDataSchema } from '~/routes/_app.users_.$userId.data';

export type AddUserFormProgress = {
    'step-1': z.infer<typeof createUserSchema>;
    'step-2': z.infer<typeof studentDataSchema> | z.infer<typeof instructorDataSchema>;
};

export const loader = async ({ request, params }: DataFunctionArgs) => {
    const instructor = await requireUserWithPermission(request, 'users.add');
    const session = await getSession(request);
    const progress = session.get('addUserFormProgress') as AddUserFormProgress | undefined;
    return json({ instructor, progress });
};

export const action = async ({ request, params }: ActionArgs) => {
    const instructor = await requireUserWithPermission(request, 'users.add');
    const formData = await request.formData();
    const session = await getSession(request);
    try {
        const data = createUserSchema.parse(formData);
        const isEmailUsed = await prisma.user.findUnique({ where: { email: data.email } });
        if (isEmailUsed) {
            return json({ formValidationErrors: { email: [errors.user.emailExists] } });
        }
        const formProgress = session.get('addUserFormProgress') as AddUserFormProgress | undefined;
        session.set('addUserFormProgress', { ...formProgress, 'step-1': data });
        return redirect('/users/new/2', {
            headers: {
                'Set-Cookie': await commitSession(session),
            },
        });
    } catch (error) {
        return handleActionError(error);
    }
};

const AddUserLayout = () => {
    const { progress } = useLoaderData<typeof loader>();
    const actionData = useActionData<ValidationErrorActionData>();
    return (
        <>
            <p className={'text-sm text-muted-foreground py-2'}>1/3</p>
            <PageHeader>Benutzer anlegen</PageHeader>
            <p className={'text-muted-foreground text-sm'}>
                Füge hier Informationen wie Name und Rolle hinzu.
            </p>
            <div className={'mt-4'}>
                <Form method={'post'}>
                    <GeneralUserDataForm
                        defaultValues={progress?.['step-1']}
                        errors={actionData?.formValidationErrors}
                    />
                    <div className={'flex justify-end gap-2 mt-2'}>
                        <Button>
                            <ArrowRight className={'w-4 h-4'} />
                            <p>Weiter</p>
                        </Button>
                    </div>
                </Form>
            </div>
        </>
    );
};

export default AddUserLayout;
