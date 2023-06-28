import { Modal } from '~/components/ui/Modal';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '~/components/ui/Card';
import { Label } from '~/components/ui/Label';
import { Input } from '~/components/ui/Input';
import { Button, buttonVariants } from '~/components/ui/Button';
import { Separator } from '~/components/ui/Seperator';
import { DatePicker } from '~/components/ui/DatePicker';
import { Form, Link, useActionData } from '@remix-run/react';
import type { DataFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { zfd } from 'zod-form-data';
import { z, ZodError } from 'zod';
import { errors } from '~/messages/errors';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '~/components/ui/Select';
import { prisma } from '../../prisma/db';
import { DateTime } from 'luxon';
import { requireManagementPermissions } from '~/utils/user/user.server';

const timeFormatSchema = z.string().regex(/^\d{2}:\d{2}$/, errors.form.invalidTime);

const addBlockingsSchema = zfd.formData({
    name: zfd.text(z.string().optional()),
    blockingStartDate: zfd.text(),
    blockingStartTime: zfd.text(timeFormatSchema),
    blockingEndDate: zfd.text(),
    blockingEndTime: zfd.text(timeFormatSchema),
    repeat: zfd.text(z.enum(['NEVER', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'])),
});

function parseDateTime(dateString: string, timeString: z.infer<typeof timeFormatSchema>) {
    const date = DateTime.fromISO(dateString);
    const [hours, minutes] = timeString.split(':');
    return date.set({ hour: parseInt(hours), minute: parseInt(minutes) });
}

export const action = async ({ request, params }: DataFunctionArgs) => {
    try {
        const user = await requireManagementPermissions(request);
        const data = addBlockingsSchema.parse(await request.formData());

        const startDate = parseDateTime(data.blockingStartDate, data.blockingStartTime).toISO();
        const endDate = parseDateTime(data.blockingEndDate, data.blockingEndTime).toISO();
        if (!startDate || !endDate) {
            throw new Error('Error parsing dates');
        }
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
            <Form method={'post'}>
                <Card className='border-none shadow-none'>
                    <CardHeader>
                        <CardTitle>Blockierung hinzufügen</CardTitle>
                        <CardDescription>
                            Füge hier eine neue Zeit hinzu, in der du nicht für Fahrstunden zur
                            Verfügung stehst.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className='grid w-full items-center gap-4'>
                            <div className='flex flex-col space-y-1.5'>
                                <Label htmlFor='name'>Name (optional)</Label>
                                <Input name={'name'} id='name' placeholder='Physiotherapie' />
                                <Label variant={'description'}>
                                    Der Name wird niemandem außer dir angezeigt.
                                </Label>
                            </div>
                            <Separator />
                            <div className='flex flex-col space-y-1.5'>
                                <Label htmlFor='name'>Anfang</Label>
                                <div className={'flex items-start justify-between gap-2'}>
                                    <DatePicker
                                        error={formErrors?.blockingStartDate[0]}
                                        name={'blockingStartDate'}
                                    />
                                    <Input
                                        error={formErrors?.blockingStartTime[0]}
                                        name={'blockingStartTime'}
                                        placeholder={'08:00'}
                                    />
                                </div>
                            </div>
                            <div className='flex flex-col space-y-1.5'>
                                <Label htmlFor='name'>Ende</Label>
                                <div className={'flex items-start justify-between gap-2'}>
                                    <DatePicker
                                        error={formErrors?.blockingEndDate[0]}
                                        name={'blockingEndDate'}
                                    />
                                    <Input
                                        error={formErrors?.blockingEndTime[0]}
                                        name={'blockingEndTime'}
                                        placeholder={'08:00'}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor={'repeat'}>Wiederholen</Label>
                                <Select defaultValue={'NEVER'} name={'repeat'}>
                                    <SelectTrigger>
                                        <SelectValue placeholder='Nie' />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value='NEVER'>Nie</SelectItem>
                                            <SelectItem value='DAILY'>Täglich</SelectItem>
                                            <SelectItem value='WEEKLY'>Wöchentlich</SelectItem>
                                            <SelectItem value='MONTHLY'>Monatlich</SelectItem>
                                            <SelectItem value='YEARLY'>Jährlich</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className='flex justify-between'>
                        <Link to={'..'} className={buttonVariants({ variant: 'outline' })}>
                            Abbrechen
                        </Link>
                        <Button>Speichern</Button>
                    </CardFooter>
                </Card>
            </Form>
        </Modal>
    );
};

export default InstructorBlockingsPage;
