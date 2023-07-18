import type { DataFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, Outlet, useLoaderData } from '@remix-run/react';
import { Suspense } from 'react';
import { Await } from 'react-router';
import { getFullName } from '~/utils/hooks/user';
import { Separator } from '~/components/ui/Seperator';
import { SidebarNav, TopNavigation } from '~/components/features/SideNavigation';
import { requireUser } from '~/utils/user/user.server';
import type { User } from '.prisma/client';
import { PageHeader } from '~/components/ui/PageHeader';
import { DrivingSchoolForm } from '~/components/features/driving-school/DrivingSchoolForm';
import { Button } from '~/components/ui/Button';
import { Label } from '~/components/ui/Label';
import { Input } from '~/components/ui/Input';
import { useDebounceFetcher } from '~/utils/form/debounce-fetcher';
import { FormStatusIndicator } from '~/components/ui/FormStatusIndicator';
import type { SchemaValidationErrorActionData } from '~/types/general-types';
import { ValidationErrorActionData } from '~/types/general-types';
import { zfd } from 'zod-form-data';
import { z } from 'zod';
import { handleActionError, transformErrors } from '~/utils/general-utils';
import { requireUserWithPermission } from '~/utils/user/permissions.server';
import { prisma } from '../../prisma/db';
import { sendJsonWithSuccessMessage } from '~/utils/flash/toast.server';
import { findUser } from '~/models/user.server';
import { requireResult } from '~/utils/db/require-result.server';
import { commitSession, getSession } from '~/utils/session/session.server';
import { UserProfileCard } from '~/components/features/user/UserProfileCard';

const sidebarNavItems = (user?: User) => [
    {
        title: 'Blockierungen',
        href: 'blocked-slots',
        show: user?.role === 'INSTRUCTOR',
    },
];

const editProfileSchema = zfd.formData({
    firstName: zfd.text(),
    lastName: zfd.text(),
    email: zfd.text(),
    phone: zfd.text(z.string().optional()),
});

export const loader = async ({ request, params }: DataFunctionArgs) => {
    const user = await requireUserWithPermission(request, 'profile.edit');
    const databaseUser = await findUser(user.id).then(requireResult);
    return json({ databaseUser });
};

export const action = async ({ request, params }: DataFunctionArgs) => {
    const user = await requireUserWithPermission(request, 'profile.edit');

    try {
        const data = editProfileSchema.parse(await request.formData());
        const updatedUser = await prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                ...data,
            },
        });
        /**
         * Then we need to update the session
         */
        const session = await getSession(request);
        session.set('user', updatedUser);
        session.flash('toast', {
            title: 'Profil aktualisiert',
            description: 'Dein Profil wurde erfolgreich aktualisiert.',
        });
        return json(
            {},
            {
                headers: {
                    'Set-Cookie': await commitSession(session),
                },
            }
        );
    } catch (error) {
        return handleActionError(error);
    }
};

const Me = () => {
    const { databaseUser } = useLoaderData<typeof loader>();
    const fetcher =
        useDebounceFetcher<SchemaValidationErrorActionData<z.infer<typeof editProfileSchema>>>();
    const errors = fetcher.data?.formValidationErrors
        ? transformErrors<z.infer<typeof editProfileSchema>>(fetcher.data.formValidationErrors)
        : undefined;
    return (
        <>
            <div className={'w-full'}>
                <div>
                    <h3 className='text-lg font-medium'>Generell</h3>
                    <p className='text-sm text-muted-foreground'>
                        Hier kannst du dein Profil bearbeiten
                    </p>
                </div>
                <Separator className={'my-4'} />
                <fetcher.Form method={'post'}>
                    <FormStatusIndicator state={fetcher.state} position={'end'} />
                    <div className={'grid grid-cols-2 gap-2'}>
                        <div className={'grid gap-2'}>
                            <Label>Vorname</Label>
                            <Input
                                autosave={true}
                                fetcher={fetcher}
                                defaultValue={databaseUser.firstName}
                                name={'firstName'}
                                error={errors?.firstName}></Input>
                        </div>
                        <div className={'grid gap-2'}>
                            <Label>Nachname</Label>
                            <Input
                                autosave={true}
                                fetcher={fetcher}
                                defaultValue={databaseUser.lastName}
                                name={'lastName'}
                                error={errors?.lastName}></Input>
                        </div>
                        <div className={'grid gap-2'}>
                            <Label>E-Mail</Label>
                            <Input
                                autosave={true}
                                fetcher={fetcher}
                                defaultValue={databaseUser.email}
                                name={'email'}
                                error={errors?.email}></Input>
                        </div>
                        <div className={'grid gap-2'}>
                            <Label>Telefonnummer</Label>
                            <Input
                                autosave={true}
                                fetcher={fetcher}
                                name={'phoneNumber'}
                                error={errors?.phone}></Input>
                        </div>
                    </div>
                </fetcher.Form>
                <Separator className={'my-4'} />
                <Label>Vorschau</Label>
                <UserProfileCard user={databaseUser} />
            </div>
        </>
    );
};
export default Me;
