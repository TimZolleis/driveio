import type { DataFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { requireParameter } from '~/utils/general-utils';
import { prisma } from '../../prisma/db';
import { requireResult } from '~/utils/db/require-result.server';
import { getUserData } from '~/utils/user/user.server';
import { Form, useActionData, useLoaderData, useSubmit } from '@remix-run/react';
import { StudentDataForm } from '~/components/features/user/student/StudentDataForm';
import { isInstructorData, isStudentData } from '~/utils/user/student-data';
import { Separator } from '~/components/ui/Seperator';
import { getLocationByCoordinates } from '~/utils/bing-maps';
import { InstructorDataForm } from '~/components/features/user/instructor/InstructorDataForm';
import { requireUserWithPermission } from '~/utils/user/permissions.server';
import { findUser } from '~/models/user.server';
import { Checkbox } from '~/components/ui/CheckBox';
import login_ from '~/routes/login_';
import { toastMessage } from '~/utils/flash/toast.server';
import { Switch } from '~/components/ui/Switch';
import { PageHeader } from '~/components/ui/PageHeader';

export const loader = async ({ request, params }: DataFunctionArgs) => {
    const managementUser = await requireUserWithPermission(request, 'permissions.view');
    const userId = requireParameter('userId', params);
    const user = await findUser(userId).then(requireResult);
    const permissions = await prisma.permission.findMany();
    return { user, permissions };
};

export const action = async ({ request, params }: DataFunctionArgs) => {
    const managementUser = await requireUserWithPermission(request, 'permissions.edit');
    const formData = await request.formData();

    const permissions = formData.getAll('permission').map((el) => el?.toString());
    const isAdmin = formData.get('isAdmin') === 'on';
    const userId = requireParameter('userId', params);
    const user = await prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            admin: isAdmin,
            permissions: {
                set: permissions.map((permission) => ({ id: permission })),
            },
        },
    });

    return json(
        {},
        {
            headers: {
                'Set-Cookie': await toastMessage(request, {
                    title: 'Berechtigungen gespeichert',
                    description: `Berechtigungen für ${user.firstName} ${user.lastName} wurden erfolgreich gespeichert.`,
                }),
            },
        }
    );
};

const EditUserPermissionsPage = () => {
    const { permissions, user } = useLoaderData<typeof loader>();
    const submit = useSubmit();
    return (
        <div className={'w-full'}>
            <div>
                <PageHeader>Berechtigungen</PageHeader>
                <p className='text-sm text-muted-foreground'>
                    Hier können die Berechtigungen des Benutzers bearbeitet werden.
                </p>
            </div>
            <Separator className={'my-6'} />
            <Form method={'POST'} onChange={(event) => submit(event.currentTarget)}>
                <div
                    className={
                        'space-y-2 flex flex-row items-center justify-between rounded-lg border p-4'
                    }>
                    <div className={'space-y-0.5'}>
                        <label
                            className={
                                'font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-base leading-3'
                            }
                            htmlFor='isAdmin'>
                            Administrator
                        </label>
                        <p className={'text-[0.8rem] text-muted-foreground'}>
                            Administratoren haben sämtliche Rechte, ist diese Option aktiviert,
                            werden nachfolgende Einstellungen ignoriert.
                        </p>
                    </div>
                    <Switch defaultChecked={user.admin} name={'isAdmin'} />
                </div>

                <div className={'grid gap-2 mt-4 '}>
                    {permissions
                        .sort((a, b) => a.displayName.localeCompare(b.displayName))
                        .map((permission) => (
                            <div key={permission.id} className={'flex items-center gap-2 group'}>
                                <Checkbox
                                    disabled={user.admin}
                                    defaultChecked={
                                        !!user.permissions.find(
                                            (userPermission) => userPermission.id === permission.id
                                        )
                                    }
                                    value={permission.id}
                                    name={'permission'}
                                />
                                <p className={'text-gray-800 text-sm'}>{permission.displayName}</p>
                            </div>
                        ))}
                </div>
            </Form>
        </div>
    );
};

export default EditUserPermissionsPage;
