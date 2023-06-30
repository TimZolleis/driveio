import { useActionData, useLoaderData } from '@remix-run/react';
import { DataFunctionArgs, json, redirect } from '@remix-run/node';
import { requireManagementPermissions } from '~/utils/user/user.server';
import { prisma } from '../../prisma/db';
import { requireParameter } from '~/utils/general-utils';
import { requireResult } from '~/utils/db/require-result.server';
import { Modal } from '~/components/ui/Modal';
import { BlockingForm } from '~/components/features/blocking/BlockingForm';
import { ZodError } from 'zod';
import { errors } from '~/messages/errors';
import { getBlockingFromFormData } from '~/routes/_app.me.blocked-slots.add';

export const loader = async ({ request, params }: DataFunctionArgs) => {
    const user = await requireManagementPermissions(request);
    const slotId = requireParameter('slotId', params);
    const blockedSlot = await prisma.blocking
        .findUnique({ where: { id: slotId } })
        .then(requireResult);

    return json({ blockedSlot });
};

export const action = async ({ request, params }: DataFunctionArgs) => {
    try {
        const slotId = requireParameter('slotId', params);
        const user = await requireManagementPermissions(request);
        const { data, startDate, endDate } = getBlockingFromFormData(await request.formData());
        await prisma.blocking.update({
            where: {
                id: slotId,
            },
            data: {
                userId: user.id,
                startDate,
                endDate,
                name: data.name,
                repeat: data.repeat,
            },
        });
        return redirect(`/me/blocked-slots`);
    } catch (error) {
        if (error instanceof ZodError) {
            return json({ formValidationErrors: error.formErrors.fieldErrors });
        }
        return json({ error: errors.unknown });
    }
};

const InstructorBlockingsPage = () => {
    const { blockedSlot } = useLoaderData<typeof loader>();
    const actionData = useActionData();
    const formErrors = actionData?.formValidationErrors;
    return (
        <Modal open={true}>
            <BlockingForm intent={'EDIT'} blocking={blockedSlot} errors={formErrors} />
        </Modal>
    );
};

export default InstructorBlockingsPage;
