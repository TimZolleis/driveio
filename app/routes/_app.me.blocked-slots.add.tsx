import { Modal } from '~/components/ui/Modal';
import { useActionData } from '@remix-run/react';
import type { DataFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { zfd } from 'zod-form-data';
import { z, ZodError } from 'zod';
import { errors } from '~/messages/errors';
import { prisma } from '../../prisma/db';
import { DateTime } from 'luxon';
import { requireManagementPermissions } from '~/utils/user/user.server';
import { BlockingForm } from '~/components/features/blocking/BlockingForm';

const timeFormatSchema = z.string().regex(/^\d{2}:\d{2}$/, errors.form.invalidTime);

const addBlockingsSchema = zfd.formData({
    name: zfd.text(z.string().optional()),
    blockingStartDate: zfd.text(),
    blockingStartTime: zfd.text(timeFormatSchema),
    blockingEndDate: zfd.text(),
    blockingEndTime: zfd.text(timeFormatSchema),
    repeat: zfd.text(z.enum(['NEVER', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'])),
});

export function getBlockingFromFormData(formData: FormData) {
    const data = addBlockingsSchema.parse(formData);
    const startDate = parseDateTime(data.blockingStartDate, data.blockingStartTime).toISO();
    const endDate = parseDateTime(data.blockingEndDate, data.blockingEndTime).toISO();
    if (!startDate || !endDate) {
        throw new Error('Error parsing dates');
    }
    return { data, startDate, endDate };
}

function parseDateTime(dateString: string, timeString: z.infer<typeof timeFormatSchema>) {
    const date = DateTime.fromISO(dateString);
    const [hours, minutes] = timeString.split(':');
    return date.set({ hour: parseInt(hours), minute: parseInt(minutes) });
}

export const action = async ({ request, params }: DataFunctionArgs) => {
    try {
        const user = await requireManagementPermissions(request);
        const { data, startDate, endDate } = getBlockingFromFormData(await request.formData());
        await prisma.blocking.create({
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
        console.log(error);
        if (error instanceof ZodError) {
            return json({ formValidationErrors: error.formErrors.fieldErrors });
        }
        return json({ error: errors.unknown });
    }
};

const InstructorBlockingsPage = () => {
    const actionData = useActionData();
    const formErrors = actionData?.formValidationErrors;

    return (
        <Modal open={true}>
            <BlockingForm intent={'ADD'} errors={formErrors}></BlockingForm>
        </Modal>
    );
};

export default InstructorBlockingsPage;
