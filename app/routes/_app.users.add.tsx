import type { DataFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { zfd } from 'zod-form-data';
import { z, ZodError } from 'zod';
import { requireManagementPermissions } from '~/utils/user/user.server';
import { prisma } from '../../prisma/db';
import { Prisma, ROLE } from '.prisma/client';
import { errors } from '~/messages/errors';
import { Modal } from '~/components/ui/Modal';
import { Card, CardDescription, CardTitle } from '~/components/ui/Card';
import { AddUserForm } from '~/components/features/user/AddUserForm';
import { useNavigate } from 'react-router';
import { useActionData } from '@remix-run/react';
import type { ValidationErrors } from '~/types/general-types';

const addUserFormSchema = zfd.formData({
    firstName: zfd.text(),
    lastName: zfd.text(),
    email: zfd.text(),
    role: zfd.text(z.enum(['INSTRUCTOR', 'MANAGEMENT', 'STUDENT'])),
});

export type AddUserActionData = {
    error?: string;
    isZodError?: boolean;
};

export function getRandomCode(length: number) {
    return Math.floor(
        Math.pow(10, length - 1) +
            Math.random() * (Math.pow(10, length) - Math.pow(10, length - 1) - 1)
    );
}

export const action = async ({ request, params }: DataFunctionArgs) => {
    try {
        const user = await requireManagementPermissions(request);
        const formData = addUserFormSchema.parse(await request.formData());
        const registeredUser = await prisma.user.create({
            data: {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                role: formData.role,
                admin: false,
                drivingSchoolId: user.drivingSchoolId,
            },
        });
        const code = getRandomCode(6);
        await prisma.registration.create({ data: { code, userId: registeredUser.id } });
        return redirect(`/users/${registeredUser.id}/data`);
    } catch (error) {
        if (error instanceof ZodError) {
            return json({ formValidationErrors: error.formErrors.fieldErrors });
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return json({ error: 'Diese E-Mail existiert bereits' });
            }
        }
        return json({ error: errors.unknown });
    }
};

const AddUserPage = () => {
    const navigate = useNavigate();
    const onClose = () => {
        navigate('/users');
    };

    const validationErrors = useActionData<ValidationErrors>();

    return (
        <Modal open={true} onClose={onClose}>
            <Card className={'border-none shadow-none p-0'}>
                <div className={'grid gap-2'}>
                    <CardTitle>Benutzer hinzufügen</CardTitle>
                    <CardDescription>
                        Hier kann ein neuer Benutzer hinzugefügt werden. Die Eingabe der jeweiligen
                        Stammdaten erfolgt danach.
                    </CardDescription>
                </div>
                <AddUserForm errors={validationErrors} className={'mt-5'} action={'/users/add'} />
            </Card>
        </Modal>
    );
};

export default AddUserPage;
