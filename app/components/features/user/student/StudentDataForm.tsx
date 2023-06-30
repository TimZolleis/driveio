import type { StudentData, User } from '.prisma/client';
import { Form, Link, useFetcher } from '@remix-run/react';
import { DatePicker } from '~/components/ui/DatePicker';
import { Label } from '~/components/ui/Label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '~/components/ui/Select';
import { trainingClasses, trainingPhases } from '~/config/trainingClasses';
import { Input } from '~/components/ui/Input';
import { Button, buttonVariants } from '~/components/ui/Button';
import type { LocationApiRoute } from '~/routes/api.location';
import { AddressCombobox } from '~/components/ui/AddressCombobox';
import { Separator } from '~/components/ui/Seperator';
import type { BingMapsLocation } from '~/types/bing-maps-location';
import { cn } from '~/utils/css';

interface StudentDataFormProps {
    studentData?: StudentData;
    instructors: User[];
    errors?: {
        [key: string]: string[];
    };
    currentAddress?: BingMapsLocation | undefined;
}

export const StudentDataForm = ({
    studentData,
    errors,
    instructors,
    currentAddress,
}: StudentDataFormProps) => {
    const fetcher = useFetcher<LocationApiRoute>();
    return (
        <Form method={'post'}>
            <div className={'grid gap-2'}>
                <Label>Geburtsdatum</Label>
                <DatePicker
                    defaultValue={
                        studentData?.dateOfBirth ? new Date(studentData?.dateOfBirth) : undefined
                    }
                    required={true}
                    name={'dateOfBirth'}
                />
                <p className={'text-xs text-destructive'}>{errors?.dateOfBirth[0]}</p>
            </div>
            <div className={'py-3'}>
                <Separator />
            </div>
            <div className={'grid grid-cols-2 gap-2'}>
                <div className={'grid gap-2'}>
                    <Label>Ausbildungsbeginn</Label>
                    <DatePicker
                        name={'trainingBegin'}
                        defaultValue={
                            studentData?.trainingBegin
                                ? new Date(studentData.trainingBegin)
                                : new Date()
                        }
                    />
                </div>
                <div className={'grid gap-2'}>
                    <Label>Ausbildungsende</Label>
                    <DatePicker
                        defaultValue={
                            studentData?.trainingEnd ? new Date(studentData.trainingEnd) : undefined
                        }
                        name={'trainingEnd'}
                    />
                </div>
                <div className={'grid gap-2'}>
                    <Label>Ausbildungsklasse</Label>
                    <Select
                        defaultValue={studentData?.trainingClass || 'B'}
                        required
                        name={'trainingClass'}>
                        <SelectTrigger className='w-full'>
                            <SelectValue placeholder='Ausbildungsklasse' />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.keys(trainingClasses).map((key) => (
                                <SelectItem key={key} value={key}>
                                    {key}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className={'grid gap-2'}>
                    <Label>Ausbildungsphase</Label>
                    <Select
                        defaultValue={studentData?.trainingPhase || 'DEFAULT'}
                        required
                        name={'trainingPhase'}>
                        <SelectTrigger className='w-full'>
                            <SelectValue placeholder='Ausbildungsphase' />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.keys(trainingPhases).map((key) => (
                                <SelectItem key={key} value={key}>
                                    {trainingPhases[key as keyof typeof trainingPhases]}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className={'grid gap-2 mt-2'}>
                <Label>Fahrlehrer</Label>
                <Select defaultValue={studentData?.instructorId || undefined} name={'instructorId'}>
                    <SelectTrigger className='w-full'>
                        <SelectValue placeholder='Fahrlehrer' />
                    </SelectTrigger>
                    <SelectContent>
                        {instructors.map((instructor) => (
                            <SelectItem key={instructor.id} value={instructor.id}>
                                {`${instructor.firstName} ${instructor.lastName}`}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className={'text-xs text-destructive'}>{errors?.instructor[0]}</p>
            </div>

            <div className={'py-3'}>
                <Separator />
            </div>
            <div className={'flex items-center gap-2'}>
                <div className={'grid gap-2 w-full'}>
                    <Label>Abholort</Label>
                    <AddressCombobox
                        defaultLocation={currentAddress}
                        results={fetcher.data?.results || []}
                        onInput={(query) => fetcher.load(`/api/location?query=${query}`)}
                    />
                </div>
                <div className={'grid gap-2'}>
                    <Label>Wartezeit</Label>
                    <Input name={'waitingTime'} defaultValue={studentData?.waitingTime || '30'} />
                </div>
            </div>
            <div className={'flex mt-5 justify-end gap-3'}>
                <Link
                    to={`/users/${studentData?.userId}/end-training`}
                    className={cn(
                        buttonVariants(),
                        'bg-amber-500/30 text-amber-800 hover:bg-amber-500/50'
                    )}>
                    Ausbildung beenden
                </Link>
                <Link to={'/users'} className={buttonVariants({ variant: 'secondary' })}>
                    Abbrechen
                </Link>
                <Button variant={'brand'}>Speichern</Button>
            </div>
        </Form>
    );
};
