import { Form, useLoaderData, useSearchParams } from '@remix-run/react';
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
    const availableInstructors = await getInstructors(instructor.drivingSchoolId);
    const licenseClasses = await prisma.licenseClass.findMany({
        where: {
            drivingSchoolId: instructor.drivingSchoolId,
        },
    });
    const lessonTypes = await prisma.lessonType.findMany({
        where: {
            drivingSchoolId: instructor.drivingSchoolId,
        },
    });
    const session = await getSession(request);
    const progress = session.get('addUserFormProgress') as AddUserFormProgress | undefined;
    return json({
        instructor,
        progress,
        availableInstructors,
        licenseClasses,
        lessonTypes,
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
    const { availableInstructors, progress, lessonTypes, licenseClasses } =
        useLoaderData<typeof loader>();
    return (
        <>
            <p className={'text-sm text-muted-foreground py-2'}>2/3</p>
            <PageHeader>Benutzer anlegen</PageHeader>
            <p className={'text-muted-foreground text-sm'}>
                Füge hier Informationen wie Name und Rolle hinzu.
            </p>
            <div className={'mt-4'}>
                <Form method={'post'}>
                    {progress?.['step-1'].role === ROLE.STUDENT && (
                        <StudentDataForm
                            defaultValues={
                                progress?.['step-2'] as z.infer<typeof studentDataSchema>
                            }
                            instructors={availableInstructors}
                            licenseClasses={licenseClasses}
                            lessonTypes={lessonTypes}>
                            <Button>
                                <ArrowRight className={'w-4 h-4'} />
                                <p>Weiter</p>
                            </Button>
                        </StudentDataForm>
                    )}
                    <div className={'flex justify-end gap-2 mt-2'}></div>
                </Form>
            </div>
        </>
    );
};

const StepIndicator = () => {
    const [searchParams] = useSearchParams();
    const step = parseInt(searchParams.get('step') || '1');
    return (
        <div
            className={
                'flex items-center gap-2 justify-between font-semibold text-primary leading-none max-w-xl w-full mt-2'
            }>
            <div
                className={cn(
                    'w-10 rounded-full h-10 shrink-0 flex items-center justify-center',
                    step === 1 ? 'bg-blue-700 text-white' : 'bg-gray-100 text-primary'
                )}>
                1
            </div>

            <div className={'bg-gray-100 h-[1px] w-full'}></div>

            <div
                className={cn(
                    'w-10 rounded-full h-10 shrink-0 flex items-center justify-center',
                    step === 2 ? 'bg-blue-700 text-white' : 'bg-gray-100 text-primary'
                )}>
                2
            </div>
            <div className={'bg-gray-100 h-[1px] w-full'}></div>
            <div
                className={cn(
                    'w-10 rounded-full h-10 shrink-0 flex items-center justify-center',
                    step === 3 ? 'bg-blue-700 text-white' : 'bg-gray-100 text-primary'
                )}>
                3
            </div>
        </div>
    );
};

export default AddUserLayout;
