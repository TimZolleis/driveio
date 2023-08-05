import { Form, Link, useLoaderData, useSearchParams } from '@remix-run/react';
import { cn } from '~/utils/css';
import type { ActionArgs, DataFunctionArgs, SerializeFrom } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { getQuery, handleActionError, safeParseFloat } from '~/utils/general-utils';
import { requireRole } from '~/utils/user/user.server';
import type { Registration } from '.prisma/client';
import { ROLE } from '.prisma/client';
import type { studentDataSchema } from '~/components/features/user/student/StudentDataForm';
import { Button, buttonVariants } from '~/components/ui/Button';
import { commitSession, getSession } from '~/utils/session/session.server';
import type { AddUserFormProgress } from '~/routes/_app.users_.new';
import { PageHeader } from '~/components/ui/PageHeader';
import { prisma } from '../../prisma/db';
import type z from 'zod';
import type { ReactNode } from 'react';
import { roles } from '~/messages/roles';
import { DateTime } from 'luxon';
import { getSafeISOStringFromDateTime } from '~/utils/luxon/parse-hour-minute';
import { createRegistration } from '~/models/registration.server';
import { ErrorCard } from '~/components/ui/ErrorComponent';

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

    const registrationId = getQuery(request, 'registration');
    const registration = registrationId
        ? await prisma.registration.findUnique({
              where: {
                  id: registrationId,
              },
          })
        : undefined;
    return json({
        instructor,
        progress,
        registration,
    });
};

export const action = async ({ request, params }: ActionArgs) => {
    const instructor = await requireRole(request, ROLE.INSTRUCTOR);
    const session = await getSession(request);
    const progress = session.get('addUserFormProgress') as AddUserFormProgress | undefined;
    if (!progress) {
        throw redirect('/users/new');
    }
    try {
        const user = await prisma.user.create({
            data: {
                firstName: progress['step-1'].firstName,
                lastName: progress['step-1'].lastName,
                email: progress['step-1'].email,
                role: progress['step-1'].role,
                drivingSchoolId: instructor.drivingSchoolId,
            },
        });
        //TODO: Add instructor data
        if (progress && isStudentDataSchema(progress)) {
            console.log(progress['step-2'].lessonTypeId);
            const studentData = await prisma.studentData.create({
                data: {
                    userId: user.id,
                    dateOfBirth: getSafeISOStringFromDateTime(
                        DateTime.fromFormat(progress['step-2'].dateOfBirth, 'dd.MM.yyyy')
                    ),
                    instructorId: progress['step-2'].instructorId,
                    lessonTypeId:
                        progress['step-2'].lessonTypeId === 'auto'
                            ? null
                            : progress['step-2'].lessonTypeId,
                    trainingPhase: progress['step-2'].trainingPhase,
                    licenseClassId: progress['step-2'].licenseClassId,
                    pickupLat: safeParseFloat(progress['step-2'].pickupLat),
                    pickupLng: safeParseFloat(progress['step-2'].pickupLng),
                    trainingBegin: progress['step-2'].trainingBegin,
                    trainingEnd: progress['step-2'].trainingEnd,
                    waitingTime: progress['step-2'].waitingTime,
                },
            });
        }
        const registration = await createRegistration(user);
        session.unset('addUserFormProgress');
        const url = new URL(request.url);
        url.searchParams.set('success', 'true');
        url.searchParams.set('registration', registration.id);
        return redirect(url.toString(), {
            headers: {
                'Set-Cookie': await commitSession(session),
            },
        });
    } catch (error) {
        console.log(error);
        return handleActionError(error);
    }
};

const AddUserLayout = () => {
    const { progress, registration } = useLoaderData<typeof loader>();
    const [searchParams] = useSearchParams();
    return (
        <>
            {searchParams.get('success') === 'true' && registration ? (
                <Success registration={registration} />
            ) : (
                progress && (
                    <>
                        <p className={'text-sm text-muted-foreground py-2'}>2/3</p>
                        <PageHeader>Zusammenfassung</PageHeader>
                        <p className={'text-muted-foreground text-sm'}>
                            Überprüfe hier die Daten des neuen Benutzers
                        </p>
                        <div className='mt-6 border-t border-gray-100 border-b'>
                            <dl className='divide-y divide-gray-100'>
                                <SummaryColumn title={'Name'}>
                                    {progress['step-1'].firstName} {progress['step-1'].lastName}
                                </SummaryColumn>
                                <SummaryColumn title={'Email'}>
                                    {progress['step-1'].email}
                                </SummaryColumn>
                                <SummaryColumn title={'Rolle'}>
                                    {roles[progress['step-1'].role]}
                                </SummaryColumn>
                            </dl>
                        </div>
                        <Form
                            method={'post'}
                            className={'justify-end flex items-center gap-2 mt-4'}>
                            <Link
                                to={'/users/new/data'}
                                className={buttonVariants({ variant: 'secondary' })}>
                                Zurück
                            </Link>
                            <Button>Benutzer erstellen</Button>
                        </Form>
                    </>
                )
            )}
        </>
    );
};

const Success = ({ registration }: { registration: SerializeFrom<Registration> }) => {
    return (
        <ErrorCard
            title={'Benutzer erstellt!'}
            description={
                'Der Benutzer wurde erfolgreich erstellt und kann sich nun mit folgendem Code anmelden'
            }
            image={'https://illustrations.popsy.co/amber/student-with-diploma.svg'}>
            <p className={'font-semibold text-3xl'}>{registration.code}</p>
            <Link to={'/users/new'} className={cn(buttonVariants({ variant: 'outline' }), 'mt-4')}>
                Weitere Benutzer erstellen
            </Link>
        </ErrorCard>
    );
};

const SummaryColumn = ({ title, children }: { title: string; children: ReactNode }) => {
    return (
        <div className='px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0'>
            <dt className='text-sm font-medium leading-6 text-gray-900'>{title}</dt>
            <dd className='mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0'>
                {children}
            </dd>
        </div>
    );
};

export default AddUserLayout;
