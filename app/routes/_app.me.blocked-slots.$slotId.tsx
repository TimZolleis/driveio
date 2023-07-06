import { useActionData, useLoaderData } from '@remix-run/react';
import type { DataFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { requireManagementPermissions } from '~/utils/user/user.server';
import { prisma } from '../../prisma/db';
import { requireParameter } from '~/utils/general-utils';
import { requireResult } from '~/utils/db/require-result.server';
import { Modal } from '~/components/ui/Modal';
import { BlockedSlotForm } from '~/components/features/blocked-slots/BlockedSlotForm';
import { ZodError } from 'zod';
import { errors } from '~/messages/errors';
import { getBlockedSlotFromFormData } from '~/routes/_app.me.blocked-slots.add';

export const loader = async ({ request, params }: DataFunctionArgs) => {
    const user = await requireManagementPermissions(request);
    const slotId = requireParameter('slotId', params);
    const blockedSlot = await prisma.blockedSlot
        .findUnique({ where: { id: slotId } })
        .then(requireResult);

    return json({ blockedSlot });
};

export const action = async ({ request, params }: DataFunctionArgs) => {
    try {
        const slotId = requireParameter('slotId', params);
        const user = await requireManagementPermissions(request);
        const { data, startDate, endDate } = getBlockedSlotFromFormData(await request.formData());
        await prisma.blockedSlot.update({
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

const InstructorBlockedSlotsPage = () => {
    const { blockedSlot } = useLoaderData<typeof loader>();
    const actionData = useActionData();
    const formErrors = actionData?.formValidationErrors;
    return (
        <Modal open={true}>
            <BlockedSlotForm intent={'EDIT'} blockedSlot={blockedSlot} errors={formErrors} />
        </Modal>
    );
};

export default InstructorBlockedSlotsPage;
