import { DataFunctionArgs, json, redirect } from '@remix-run/node';
import { zfd } from 'zod-form-data';
import { ZodError } from 'zod';
import { requireManagementPermissions, requireUser } from '~/utils/user/user.server';
import { prisma } from '../../prisma/db';
import { Prisma } from '.prisma/client';
import { errors } from '~/messages/errors';
import { Modal } from '~/components/ui/Modal';
import { Card, CardDescription, CardTitle } from '~/components/ui/Card';
import { AddUserForm } from '~/components/features/user/AddUserForm';
import { useNavigate } from 'react-router';
import { requireParameter } from '~/utils/general-utils';
import { useActionData, useLoaderData } from '@remix-run/react';
import { UserForm } from '~/components/features/user/UserForm';
import { requireResult } from '~/utils/db/require-result.server';
import { err } from '@remix-run/dev/dist/result';

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
        return redirect('/users');
    } catch (error) {
        if (error instanceof ZodError) {
            return json({ formValidationErrors: error.formErrors.fieldErrors });
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return json({
                    formValidationErrors: {
                        email: [errors.user.emailExists],
                    },
                });
            }
        }
        return json({ error: errors.unknown });
    }
};

const AddUserPage = () => {
    const { user } = useLoaderData<typeof loader>();
    const data = useActionData<ActionData>();
    const navigate = useNavigate();
    const onClose = () => {
        navigate('/users');
    };
    return (
        <Modal open={true} onClose={onClose}>
            <Card className={'border-none shadow-none p-0'}>
                <div className={'grid gap-2'}>
                    <CardTitle>Benutzer bearbeiten</CardTitle>
                </div>
                <UserForm errors={data?.formValidationErrors} user={user} />
            </Card>
        </Modal>
    );
};

export default AddUserPage;
