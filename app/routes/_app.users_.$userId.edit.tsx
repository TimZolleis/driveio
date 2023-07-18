import type { DataFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { zfd } from 'zod-form-data';
import { ZodError } from 'zod';
import { requireManagementPermissions } from '~/utils/user/user.server';
import { prisma } from '../../prisma/db';
import { Prisma } from '.prisma/client';
import { errors } from '~/messages/errors';
import { useNavigate } from 'react-router';
import { handleActionError, requireParameter, useDoubleCheck } from '~/utils/general-utils';
import {
    Form,
    Link,
    useActionData,
    useLoaderData,
    useNavigation,
    useSubmit,
} from '@remix-run/react';
import { UserForm } from '~/components/features/user/UserForm';
import { requireResult } from '~/utils/db/require-result.server';
import { toastMessage } from '~/utils/flash/toast.server';
import { Separator } from '~/components/ui/Seperator';
import { PageHeader } from '~/components/ui/PageHeader';
import { Button, buttonVariants } from '~/components/ui/Button';
import { AlertCircle, Trash2 } from 'lucide-react';
import { requireUserWithPermission } from '~/utils/user/permissions.server';

const editUserFormSchema = zfd.formData({
    firstName: zfd.text(),
    lastName: zfd.text(),
    email: zfd.text(),
});

interface ActionData {
    formValidationErrors?: {
        [key: string]: string[];
    };
}

export const loader = async ({ request, params }: DataFunctionArgs) => {
    const userId = requireParameter('userId', params);
    const managementUser = await requireUserWithPermission(request, 'user.view');
    const user = await prisma.user.findUnique({ where: { id: userId } }).then(requireResult);
    return json({ user });
};

export const action = async ({ request, params }: DataFunctionArgs) => {
    const formData = await request.formData();
    try {
        const userId = requireParameter('userId', params);
        const intent = await formData.get('intent');
        if (intent === 'deleteUser') {
            const managementUser = await requireUserWithPermission(request, 'user.delete');
            await prisma.user.delete({
                where: {
                    id: userId,
                },
            });
            return redirect('/users');
        }
        const managementUser = await requireUserWithPermission(request, 'user.edit');
        const data = editUserFormSchema.parse(formData);
        await prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                ...data,
            },
        });
        return json(
            {},
            {
                headers: {
                    'Set-Cookie': await toastMessage(request, {
                        title: 'Daten gespeichert',
                        description: 'Benutzerdaten erfolgreich gespeichert',
                    }),
                },
            }
        );
    } catch (error) {
        return handleActionError(error);
    }
};

const AddUserPage = () => {
    const { user } = useLoaderData<typeof loader>();
    const data = useActionData<ActionData>();
    const doubleCheck = useDoubleCheck();

    return (
        <div className={'w-full'}>
            <div>
                <PageHeader>Generell</PageHeader>
                <p className='text-sm text-muted-foreground'>
                    Hier können generelle Details eines Benutzers bearbeitet werde n
                </p>
            </div>
            <Separator className={'my-6'} />
            <UserForm errors={data?.formValidationErrors} user={user} />
            <Form method={'post'}>
                <div className={'flex gap-3 justify-between mt-5'}>
                    <Button
                        {...doubleCheck.getButtonProps({ name: 'intent', value: 'deleteUser' })}
                        variant={'destructive'}>
                        {doubleCheck.doubleCheck ? (
                            <div className={'flex items-center gap-1'}>
                                <AlertCircle className={'w-4 h-4'}></AlertCircle>
                                <p>Benutzer wirklich löschen?</p>
                            </div>
                        ) : (
                            <div className={'flex items-center gap-1'}>
                                <Trash2 className={'w-4 h-4'}></Trash2>
                                <p>Benutzer löschen</p>
                            </div>
                        )}
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default AddUserPage;
