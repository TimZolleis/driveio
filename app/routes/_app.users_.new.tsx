import { useLoaderData, useSearchParams } from '@remix-run/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/Card';
import { cn } from '~/utils/css';
import { GeneralUserDataForm } from '~/components/features/user/GeneralUserDataForm';
import type { ActionArgs, DataFunctionArgs } from '@remix-run/node';
import { namedAction } from 'remix-utils';
import { zfd } from 'zod-form-data';
import { z } from 'zod';
import { handleActionError, raise } from '~/utils/general-utils';
import { prisma } from '../../prisma/db';
import { requireRole } from '~/utils/user/user.server';
import { ROLE } from '.prisma/client';
import { json, redirect } from '@remix-run/node';
import { errors } from '~/messages/errors';
import { findUser } from '~/models/user.server';
import { requireResult } from '~/utils/db/require-result.server';
import { instructorDataSchema, studentDataSchema } from '~/routes/_app.users_.$userId.data';

export const loader = async ({ request, params }: DataFunctionArgs) => {
    const instructor = await requireRole(request, ROLE.INSTRUCTOR);
    const url = new URL(request.url);
    const userId = url.searchParams.get('user');
    const user = await findUser(userId ?? undefined);

    return json({ user, instructor });
};

const createUserSchema = zfd.formData({
    firstName: zfd.text(),
    lastName: zfd.text(),
    email: zfd.text(),
    role: zfd.text(z.enum(['INSTRUCTOR', 'MANAGEMENT', 'STUDENT'])),
});

export const action = async ({ request, params }: ActionArgs) => {
    const instructor = await requireRole(request, ROLE.INSTRUCTOR);
    const url = new URL(request.url);
    // @ts-ignore
    return namedAction(request, {
        async createUser() {
            try {
                const userId = url.searchParams.get('user');
                const data = createUserSchema.parse(await request.formData());
                const user = await prisma.user.upsert({
                    where: { id: userId || undefined },
                    create: {
                        ...data,
                        admin: false,
                        drivingSchoolId: instructor.drivingSchoolId,
                    },
                    update: {
                        ...data,
                    },
                });
                url.searchParams.set('step', '2');
                url.searchParams.set('role', user.role.toLowerCase());
                url.searchParams.set('user', user.id);
                return redirect(url.toString());
            } catch (error) {
                return handleActionError(error);
            }
        },

        async createUserData() {
            const userId = url.searchParams.get('user');
            const user = await findUser(userId ?? undefined).then((res) =>
                requireResult(res, errors.user.notFound)
            );
            const role =
                (url.searchParams.get('role')?.toUpperCase() as ROLE | undefined) ??
                raise(errors.general.paramsRequired);
            switch (role) {
                case 'STUDENT': {
                    try {
                        const data = studentDataSchema.parse(await request.formData());
                        await prisma.studentData.upsert({
                            where: {
                                userId: user.id,
                            },
                            create: {
                                ...data,
                                userId: user.id,
                                pickupLat: data.pickupLat ? parseFloat(data.pickupLat) : undefined,
                                pickupLng: data.pickupLng ? parseFloat(data.pickupLng) : undefined,
                            },
                            update: {
                                ...data,
                                pickupLat: data.pickupLat ? parseFloat(data.pickupLat) : undefined,
                                pickupLng: data.pickupLng ? parseFloat(data.pickupLng) : undefined,
                            },
                        });
                        url.searchParams.set('step', '3');
                        return redirect(url.toString());
                    } catch (error) {
                        return handleActionError(error);
                    }
                }
                case 'INSTRUCTOR': {
                    try {
                        const data = instructorDataSchema.parse(await request.formData());
                        await prisma.instructorData.upsert({
                            where: { userId: user.id },
                            update: data,
                            create: { ...data, userId: user.id },
                        });
                        url.searchParams.set('step', '3');
                        return redirect(url.toString());
                    } catch (error) {
                        return handleActionError(error);
                    }
                }
            }
        },
        async createRegistration() {},
    });
};

const AddUserLayout = () => {
    const { user } = useLoaderData<typeof loader>();
    const [searchParams] = useSearchParams();
    const step = parseInt(searchParams.get('step') || '1');
    return (
        <>
            <div className={'w-full flex justify-center'}>
                <div className={'max-w-4xl w-full'}>
                    <Card>
                        <div className={'grid gap-2'}>
                            <CardHeader>
                                <CardTitle>Benutzer hinzufügen</CardTitle>
                                <CardDescription>
                                    Hier kann ein neuer Benutzer hinzugefügt werden. Die Eingabe der
                                    jeweiligen Stammdaten erfolgt danach.
                                </CardDescription>
                                <div className={'flex justify-center w-full'}>
                                    <StepIndicator />
                                </div>
                            </CardHeader>
                            <CardContent>
                                {step === 1 && (
                                    <GeneralUserDataForm
                                        user={user}
                                        action={'?/createUser'}></GeneralUserDataForm>
                                )}
                            </CardContent>
                        </div>
                    </Card>
                </div>
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
