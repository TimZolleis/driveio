import { DataFunctionArgs, json, redirect } from '@remix-run/node';
import { prisma } from '../../prisma/db';
import { requireParameter } from '~/utils/general-utils';
import { requireResult } from '~/utils/db/require-result.server';
import { requireManagementPermissions } from '~/utils/user/user.server';
import { useLoaderData } from '@remix-run/react';
import { AlertModal } from '~/components/ui/AlertModal';
import { CardDescription, CardHeader, CardTitle } from '~/components/ui/Card';
import { getFullName } from '~/utils/hooks/user';

export const loader = async ({ request, params }: DataFunctionArgs) => {
    const managementUser = await requireManagementPermissions(request);
    const userId = requireParameter('userId', params);
    const user = await prisma.user.findUnique({ where: { id: userId } }).then(requireResult);
    return json({ user });
};

export const action = async ({ request, params }: DataFunctionArgs) => {
    const managementUser = await requireManagementPermissions(request);
    const userId = requireParameter('userId', params);
    const formData = await request.formData();
    const intent = formData.get('intent')?.toString();
    if (intent === 'confirm') {
        await prisma.user.delete({ where: { id: userId } });
    }
    return redirect('/users');
};

const DeleteUserPage = () => {
    const { user } = useLoaderData<typeof loader>();
    return (
        <AlertModal show={true}>
            <CardHeader>
                <CardTitle>Benutzer löschen</CardTitle>
                <CardDescription>
                    Soll
                    <span className={'font-medium'}>{getFullName(user)}</span>
                    wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden.
                </CardDescription>
            </CardHeader>
        </AlertModal>
    );
};
export default DeleteUserPage;
