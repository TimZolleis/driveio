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
import { getAddressByCoordinates } from '~/utils/bing-maps';
import { BingMapsResponse } from '~/types/bing-maps-response';
import { toastMessage } from '~/utils/flash/toast.server';

export const loader = async ({ request, params }: DataFunctionArgs) => {
    const userId = requireParameter('userId', params);
    const user = await prisma.user.findUnique({ where: { id: userId } }).then(requireResult);
    const instructors = await prisma.user.findMany({
        where: { drivingSchoolId: user.drivingSchoolId, role: 'INSTRUCTOR' },
    });
    const data = await getUserData(user);
    const address = isStudentData(data, user)
        ? await getAddressByCoordinates(data.pickupLat, data.pickupLng).then((res) => res.data)
        : undefined;
    return json({ data, user, instructors, address });
};

const studentDataSchema = zfd.formData({
    trainingBegin: zfd.text(z.string().optional()),
    trainingEnd: zfd.text(z.string().optional()),
    dateOfBirth: zfd.text(z.string({ required_error: errors.form.notEmpty })),
    instructorId: zfd.text(z.string({ required_error: errors.form.notEmpty })),
    trainingClass: zfd.text(),
    trainingPhase: zfd.text(),
    waitingTime: zfd.numeric(),
    pickupLat: zfd.text(z.string().optional()),
    pickupLng: zfd.text(z.string().optional()),
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
                        pickupLat: data.pickupLat ? parseFloat(data.pickupLat) : undefined,
                        pickupLng: data.pickupLng ? parseFloat(data.pickupLng) : undefined,
                    },
                    create: {
                        ...data,
                        trainingPhase:
                            data.trainingPhase === 'EXAM_PREPARATION'
                                ? TrainingPhase.EXAM_PREPARATION
                                : data.trainingPhase === 'EXTENSIVE'
                                ? TrainingPhase.EXTENSIVE
                                : TrainingPhase.DEFAULT,
                        pickupLat: data.pickupLat ? parseFloat(data.pickupLat) : undefined,
                        pickupLng: data.pickupLng ? parseFloat(data.pickupLng) : undefined,
                        userId: user.id,
                    },
                });
                return json(
                    { message: 'success' },
                    {
                        headers: {
                            'Set-Cookie': await toastMessage(request, {
                                title: 'Erfolg',
                                description: 'Stammdaten erfolgreich gespeichert',
                            }),
                        },
                    }
                );
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
    const { data, user, instructors, address } = useLoaderData<typeof loader>();
    const navigate = useNavigate();
    const actionData = useActionData<ActionData>();
    return (
        <div className={'w-full'}>
            <div>
                <h3 className='text-lg font-medium'>Stammdaten</h3>
                <p className='text-sm text-muted-foreground'>
                    Hier können die Stammdaten eines Fahrschülers / Fahrlehrers bearbeitet werden
                </p>
            </div>
            <Separator className={'my-6'} />
            {isStudentData(data, user) && (
                <StudentDataForm
                    currentAddress={address?.resourceSets[0].resources[0]}
                    studentData={data}
                    instructors={instructors}
                    errors={actionData?.formValidationErrors}
                />
            )}
        </div>
    );
};

export default SetupUserDataPage;
