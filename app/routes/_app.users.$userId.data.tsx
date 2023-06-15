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

export const loader = async ({ request, params }: DataFunctionArgs) => {
    const userId = requireParameter('userId', params);
    const user = await prisma.user.findUnique({ where: { id: userId } }).then(requireResult);
    const instructors = await prisma.user.findMany({
        where: { drivingSchoolId: user.drivingSchoolId, role: 'INSTRUCTOR' },
    });
    const data = await getUserData(user);
    return json({ data, user, instructors });
};

const studentDataSchema = zfd.formData({
    trainingBegin: zfd.text(z.string().optional()),
    trainingEnd: zfd.text(z.string().optional()),
    dateOfBirth: zfd.text(z.string({ required_error: errors.form.notEmpty })),
    instructorId: zfd.text(z.string({ required_error: errors.form.notEmpty })),
    trainingClass: zfd.text(),
    trainingPhase: zfd.text(),
    waitingTime: zfd.numeric(),
    addressLat: zfd.text(z.string().optional()),
    addressLng: zfd.text(z.string().optional()),
});

interface ActionData {
    formValidationErrors?: {
        [key: string]: string[];
    };
}

export const action = async ({ request, params }: DataFunctionArgs) => {
    try {
        const userId = requireParameter('userId', params);
        const user = await prisma.user.findUnique({ where: { id: userId } }).then(requireResult);
        const formData = await request.formData();
        switch (user.role) {
            case 'STUDENT': {
                const data = studentDataSchema.parse(formData);
                await prisma.studentData.upsert({
                    where: { userId: user.id },
                    update: {
                        ...data,
                        trainingPhase:
                            data.trainingPhase === 'EXAM_PREPARATION'
                                ? TrainingPhase.EXAM_PREPARATION
                                : data.trainingPhase === 'EXTENSIVE'
                                ? TrainingPhase.EXTENSIVE
                                : TrainingPhase.DEFAULT,
                        pickupLat: data.addressLat ? parseFloat(data.addressLat) : undefined,
                        pickupLng: data.addressLng ? parseFloat(data.addressLng) : undefined,
                    },
                    create: {
                        ...data,
                        trainingPhase:
                            data.trainingPhase === 'EXAM_PREPARATION'
                                ? TrainingPhase.EXAM_PREPARATION
                                : data.trainingPhase === 'EXTENSIVE'
                                ? TrainingPhase.EXTENSIVE
                                : TrainingPhase.DEFAULT,
                        pickupLat: data.addressLat ? parseFloat(data.addressLat) : undefined,
                        pickupLng: data.addressLng ? parseFloat(data.addressLng) : undefined,
                        userId: user.id,
                    },
                });
                return redirect('/users');
            }
            case 'INSTRUCTOR': {
                //TODO: Add instructor data
                break;
            }
            case 'MANAGEMENT': {
                //TODO: Add management data
                break;
            }
        }
    } catch (error) {
        console.log(error);
        if (error instanceof ZodError) {
            return json({ formValidationErrors: error.formErrors.fieldErrors });
        }
    }
    return null;
};

const SetupUserDataPage = () => {
    const { data, user, instructors } = useLoaderData<typeof loader>();
    const navigate = useNavigate();
    const actionData = useActionData<ActionData>();
    return (
        <Modal open={true} onClose={() => navigate('/users')}>
            <Card className={'border-none shadow-none p-0'}>
                <div className={'grid gap-2'}>
                    <CardTitle>Stammdaten bearbeiten</CardTitle>
                    <CardDescription>{`${user.firstName} ${user.lastName}`}</CardDescription>
                </div>
                <div className={'mt-5'}>
                    {isStudentData(data, user) && (
                        <StudentDataForm
                            studentData={data}
                            instructors={instructors}
                            errors={actionData?.formValidationErrors}
                        />
                    )}
                </div>
            </Card>
        </Modal>
    );
};

export default SetupUserDataPage;
