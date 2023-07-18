import type { DataFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { handleActionError, requireParameter } from '~/utils/general-utils';
import { prisma } from '../../prisma/db';
import { requireResult } from '~/utils/db/require-result.server';
import { getUserData } from '~/utils/user/user.server';
import type { ShouldRevalidateFunction } from '@remix-run/react';
import { useActionData, useLoaderData } from '@remix-run/react';
import { StudentDataForm } from '~/components/features/user/student/StudentDataForm';
import { zfd } from 'zod-form-data';
import { z, ZodError } from 'zod';
import { errors } from '~/messages/errors';
import { isInstructorData, isStudentData } from '~/utils/user/student-data';
import { Separator } from '~/components/ui/Seperator';
import { getLocationByCoordinates } from '~/utils/bing-maps';
import { sendSaveSuccessMessage, toastMessage } from '~/utils/flash/toast.server';
import { InstructorDataForm } from '~/components/features/user/instructor/InstructorDataForm';
import { timeFormatSchema } from '~/routes/_app.me.blocked-slots.add';
import { getSafeISOStringFromDateTime } from '~/utils/luxon/parse-hour-minute';
import { DateTime } from 'luxon';
import { getLicenseClasses } from '~/models/license-class.server';
import { getLessonTypes } from '~/models/lesson-type.server';
import { useEffect } from 'react';
import { upsertStudentData } from '~/models/student-data.server';

export const loader = async ({ request, params }: DataFunctionArgs) => {
    const userId = requireParameter('userId', params);
    const user = await prisma.user.findUnique({ where: { id: userId } }).then(requireResult);
    const instructors = await prisma.user.findMany({
        where: { drivingSchoolId: user.drivingSchoolId, role: 'INSTRUCTOR' },
    });
    const data = await getUserData(user);
    const address =
        data && isStudentData(data, user)
            ? await getLocationByCoordinates(data.pickupLat, data.pickupLng).then((res) => res.data)
            : undefined;
    const licenseClasses = await getLicenseClasses();
    const lessonTypes = await getLessonTypes();

    return json({ data, user, instructors, address, lessonTypes, licenseClasses });
};

export const studentDataSchema = zfd.formData({
    dateOfBirth: zfd.text(z.string({ required_error: errors.form.notEmpty })),
    trainingBegin: zfd.text(z.string().optional()),
    trainingEnd: zfd.text(z.string().optional()),
    licenseClassId: zfd.text(),
    lessonTypeId: zfd.text(),
    trainingPhase: zfd.text(z.enum(['EXAM_PREPARATION', 'DEFAULT', 'EXTENSIVE'])),
    instructorId: zfd.text(z.string({ required_error: errors.form.notEmpty })),
    pickupLat: zfd.text(z.string().optional()),
    pickupLng: zfd.text(z.string().optional()),
    waitingTime: zfd.numeric(),
});

export const instructorDataSchema = zfd.formData({
    dailyDrivingMinutes: zfd.numeric(),
    maxDefaultLessons: zfd.numeric(),
    maxExtensiveLessons: zfd.numeric(),
    maxExampreparationLessons: zfd.numeric(),
    workStartTime: zfd.text(timeFormatSchema),
    workEndTime: zfd.text(timeFormatSchema),
});

interface ActionData {
    formValidationErrors?: {
        [key: string]: string[];
    };
}

export const shouldRevalidate: ShouldRevalidateFunction = ({
    actionResult,
    defaultShouldRevalidate,
}) => {
    if (actionResult?.type === 'data' && actionResult.data?.forceRevalidation) {
        return true;
    }
    return defaultShouldRevalidate;
};

export const action = async ({ request, params }: DataFunctionArgs) => {
    try {
        const userId = requireParameter('userId', params);
        const user = await prisma.user.findUnique({ where: { id: userId } }).then(requireResult);
        const formData = await request.formData();
        const intent = formData.get('intent');
        switch (user.role) {
            case 'STUDENT': {
                if (intent === 'start-training') {
                    const trainingBegin = getSafeISOStringFromDateTime(DateTime.now());
                    await prisma.studentData.update({
                        where: {
                            userId: user.id,
                        },
                        data: {
                            trainingBegin,
                            trainingEnd: null,
                            user: {
                                update: {
                                    enabled: true,
                                },
                            },
                        },
                    });
                } else if (intent === 'end-training') {
                    const trainingEnd = getSafeISOStringFromDateTime(DateTime.now());
                    await prisma.studentData.update({
                        where: {
                            userId: user.id,
                        },
                        data: {
                            trainingEnd,
                            user: {
                                update: {
                                    enabled: false,
                                },
                            },
                        },
                    });
                } else {
                    const data = studentDataSchema.parse(formData);
                    await upsertStudentData(user.id, data);
                }
                break;
            }
            case 'INSTRUCTOR': {
                const data = instructorDataSchema.parse(formData);
                await prisma.instructorData.upsert({
                    where: { userId: user.id },
                    update: data,
                    create: { ...data, userId: user.id },
                });
                break;
            }
            case 'MANAGEMENT': {
                //TODO: Add management data
                break;
            }
        }
        return json(
            { message: 'success', forceRevalidation: true },
            {
                headers: await sendSaveSuccessMessage(request, 'Stammdaten', user),
            }
        );
    } catch (error) {
        console.log('Error', error);
        return handleActionError(error);
    }
};

const SetupUserDataPage = () => {
    const { data, user, instructors, address, lessonTypes, licenseClasses } =
        useLoaderData<typeof loader>();

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
                    lessonTypes={lessonTypes}
                    licenseClasses={licenseClasses}
                    currentAddress={address?.resourceSets[0].resources[0]}
                    studentData={data}
                    instructors={instructors}
                />
            )}
            {isInstructorData(data, user) && (
                <InstructorDataForm instructorData={data}></InstructorDataForm>
            )}
        </div>
    );
};

export default SetupUserDataPage;
