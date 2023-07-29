import { Form, useLoaderData, useNavigation, useSearchParams } from '@remix-run/react';
import { cn } from '~/utils/css';
import { GeneralUserDataForm } from '~/components/features/user/GeneralUserDataForm';
import type { ActionArgs, DataFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { handleActionError } from '~/utils/general-utils';
import { requireRole } from '~/utils/user/user.server';
import { ROLE } from '.prisma/client';
import { errors } from '~/messages/errors';
import { instructorDataSchema } from '~/routes/_app.users_.$userId.data';
import {
    StudentDataForm,
    studentDataSchema,
} from '~/components/features/user/student/StudentDataForm';
import { Button } from '~/components/ui/Button';
import { commitSession, getSession } from '~/utils/session/session.server';
import type { AddUserFormProgress } from '~/routes/_app.users_.new.1';
import { getInstructors } from '~/models/instructor.server';
import { PageHeader } from '~/components/ui/PageHeader';
import { ArrowRight } from 'lucide-react';
import { prisma } from '../../prisma/db';
import type z from 'zod';

//A type assertion function that asserts "step-2" object on progress is of type studentDataSchema
function isStudentDataSchema(
    progress: AddUserFormProgress
): progress is AddUserFormProgress & { 'step-2': z.infer<typeof studentDataSchema> } {
    return progress['step-1'].role === ROLE.STUDENT;
}

export const loader = async ({ request, params }: DataFunctionArgs) => {
    const instructor = await requireRole(request, ROLE.INSTRUCTOR);
    const session = await getSession(request);
    const progress = session.get('addUserFormProgress') as AddUserFormProgress | undefined;
    return json({
        instructor,
        progress,
    });
};

export const action = async ({ request, params }: ActionArgs) => {
    const instructor = await requireRole(request, ROLE.INSTRUCTOR);
    const url = new URL(request.url);
    const formData = await request.formData();
    const session = await getSession(request);
    const progress = session.get('addUserFormProgress') as AddUserFormProgress | undefined;
    if (!progress) {
        throw redirect('/users/new/1');
    }
    try {
        const role = progress['step-1'].role;
        switch (role) {
            case 'STUDENT': {
                const data = studentDataSchema.parse(formData);
                session.set('addUserFormProgress', { ...progress, 'step-2': data });
                break;
            }
            case 'INSTRUCTOR': {
                const data = instructorDataSchema.parse(formData);
                session.set('addUserFormProgress', { ...progress, 'step-2': data });
                break;
            }
        }
        return redirect('/users/new/3', {
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
    console.log(progress);
    const navigation = useNavigation();

    return (
        <>
            <p className={'text-sm text-muted-foreground py-2'}>2/3</p>
            <PageHeader>Zusammenfassung</PageHeader>
            <p className={'text-muted-foreground text-sm'}>
                Überprüfe hier die Daten des neuen Benutzers
            </p>
            <div className={'mt-4'}>
                <div className={'rounded-md p-3 border'}>
                    <div className={'grid grid-cols-2 text-sm gap-y-6'}></div>
                </div>
            </div>
        </>
    );
};

export default AddUserLayout;
