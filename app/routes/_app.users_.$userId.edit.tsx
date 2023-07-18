import type { DataFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { zfd } from 'zod-form-data';
import { ZodError } from 'zod';
import { requireManagementPermissions } from '~/utils/user/user.server';
import { prisma } from '../../prisma/db';
import { Prisma } from '.prisma/client';
import { errors } from '~/messages/errors';
import { useNavigate } from 'react-router';
import { handleActionError, requireParameter } from '~/utils/general-utils';
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
    const user = await prisma.user.findUnique({ where: { id: userId } }).then(requireResult);
    return json({ user });
};

export const action = async ({ request, params }: DataFunctionArgs) => {
    try {
        const userId = requireParameter('userId', params);
        const managementUser = await requireManagementPermissions(request);
        const data = editUserFormSchema.parse(await request.formData());
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
    const navigation = useNavigation();
    const submit = useSubmit();

    return (
        <div className={'w-full'}>
            <div>
                <PageHeader showSubmission={true} submission={navigation.state}>
                    Generell
                </PageHeader>
                <p className='text-sm text-muted-foreground'>
                    Hier können generelle Details eines Benutzers bearbeitet werde n
                </p>
            </div>
            <Separator className={'my-6'} />
            <UserForm errors={data?.formValidationErrors} user={user} />
            <div className={'flex gap-3 justify-between mt-5'}>
                <Link
                    className={buttonVariants({ variant: 'destructive' })}
                    to={`/users/${user.id}/delete`}>
                    Benutzer löschen
                </Link>
            </div>
        </div>
    );
};

export default AddUserPage;
