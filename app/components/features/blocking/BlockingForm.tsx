import { Blocking } from '.prisma/client';
import { Form, Link } from '@remix-run/react';
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
import { Separator } from '~/components/ui/Seperator';
import { DatePicker } from '~/components/ui/DatePicker';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '~/components/ui/Select';
import { Button, buttonVariants } from '~/components/ui/Button';
import { DateTime } from 'luxon';

type FormErrors = {
    [key: string]: string[];
};

export const BlockingForm = ({
    blocking,
    errors,
    intent,
}: {
    blocking?: Blocking;
    errors?: FormErrors;
    intent: 'ADD' | 'EDIT';
}) => {
    const startDate = blocking ? DateTime.fromISO(blocking.startDate) : undefined;
    const startTime = startDate
        ? `${startDate.toFormat('HH', {})}:${startDate.toFormat('mm')}`
        : undefined;
    const endDate = blocking ? DateTime.fromISO(blocking.endDate) : undefined;
    const endTime = endDate ? `${endDate?.toFormat('HH')}:${endDate.toFormat('mm')}` : undefined;

    return (
        <Form method={'post'}>
            <Card className='border-none shadow-none'>
                <CardHeader>
                    {intent === 'ADD' && <CardTitle>Blockierung hinzufügen</CardTitle>}
                    {intent === 'EDIT' && <CardTitle>Blockierung bearbeiten</CardTitle>}
                    {intent === 'ADD' && (
                        <CardDescription>
                            Füge hier eine neue Zeit hinzu, in der du nicht für Fahrstunden zur
                            Verfügung stehst.
                        </CardDescription>
                    )}
                    {intent === 'EDIT' && (
                        <CardDescription>
                            Bearbeite hier eine Zeit, in der du nicht für Fahrstunden zur Verfügung
                            stehst.
                        </CardDescription>
                    )}
                </CardHeader>
                <CardContent>
                    <div className='grid w-full items-center gap-4'>
                        <div className='flex flex-col space-y-1.5'>
                            <Label htmlFor='name'>Name (optional)</Label>
                            <Input
                                defaultValue={blocking?.name || undefined}
                                name={'name'}
                                id='name'
                                placeholder='Physiotherapie'
                            />
                            <Label variant={'description'}>
                                Der Name wird niemandem außer dir angezeigt.
                            </Label>
                        </div>
                        <Separator />
                        <div className='flex flex-col space-y-1.5'>
                            <Label htmlFor='name'>Anfang</Label>
                            <div className={'flex items-start justify-between gap-2'}>
                                <DatePicker
                                    defaultValue={startDate?.toJSDate()}
                                    error={errors?.blockingStartDate[0]}
                                    name={'blockingStartDate'}
                                />
                                <Input
                                    defaultValue={startTime}
                                    error={errors?.blockingStartTime[0]}
                                    name={'blockingStartTime'}
                                    placeholder={'08:00'}
                                />
                            </div>
                        </div>
                        <div className='flex flex-col space-y-1.5'>
                            <Label htmlFor='name'>Ende</Label>
                            <div className={'flex items-start justify-between gap-2'}>
                                <DatePicker
                                    defaultValue={endDate?.toJSDate()}
                                    error={errors?.blockingEndDate[0]}
                                    name={'blockingEndDate'}
                                />
                                <Input
                                    defaultValue={endTime}
                                    error={errors?.blockingEndTime[0]}
                                    name={'blockingEndTime'}
                                    placeholder={'08:00'}
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor={'repeat'}>Wiederholen</Label>
                            <Select defaultValue={blocking?.repeat || 'NEVER'} name={'repeat'}>
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
    );
};
