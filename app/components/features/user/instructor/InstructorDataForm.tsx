import type { InstructorData } from '.prisma/client';
import type { ValidationErrorActionData } from '~/types/general-types';
import { Form, Link } from '@remix-run/react';
import { Label } from '~/components/ui/Label';
import { Separator } from '~/components/ui/Seperator';
import { Input } from '~/components/ui/Input';
import { Button, buttonVariants } from '~/components/ui/Button';

interface InstructorDataFormProps {
    instructorData?: InstructorData;
    errors?: ValidationErrorActionData;
}

export const InstructorDataForm = ({ instructorData, errors }: InstructorDataFormProps) => {
    console.log(errors);
    return (
        <Form method={'post'}>
            <h4 className='font-medium'>Generell</h4>
            <div className={'grid gap-2 mt-2'}>
                <Label>Tägliche Fahrtzeit</Label>
                <Input
                    error={errors?.dailyDrivingMinutes?.[0]}
                    defaultValue={instructorData?.dailyDrivingMinutes || 415}
                    name={'dailyDrivingMinutes'}></Input>
            </div>
            <div className={'grid grid-cols-2 gap-2'}>
                <div>
                    <Label>Arbeitsbeginn</Label>
                    <Input
                        name={'workStartTime'}
                        error={errors?.workStartTime?.[0]}
                        defaultValue={instructorData?.workStartTime || '08:00'}></Input>
                </div>
                <div>
                    <Label>Arbeitsende</Label>
                    <Input
                        name={'workEndTime'}
                        error={errors?.workEndTime?.[0]}
                        defaultValue={instructorData?.workEndTime || '17:00'}></Input>
                </div>
            </div>

            <div className={'py-3'}>
                <Separator />
            </div>
            <h4 className='font-medium'>Buchungseinstellungen</h4>
            <div className={'grid grid-cols-3 gap-2'}>
                <div className={'space-y-1'}>
                    <Label>Max. Buchungen (Standard)</Label>
                    <Input
                        name={'maxDefaultLessons'}
                        defaultValue={instructorData?.maxDefaultLessons || 3}></Input>
                </div>
                <div className={'space-y-1'}>
                    <Label>Max. Buchungen (Intensiv)</Label>
                    <Input
                        name={'maxExtensiveLessons'}
                        defaultValue={instructorData?.maxExtensiveLessons || 4}></Input>
                </div>
                <div className={'space-y-1'}>
                    <Label>Max. Buchungen (Prüfungsvorbereitung)</Label>
                    <Input
                        name={'maxExampreparationLessons'}
                        defaultValue={instructorData?.maxExampreparationLessons || 5}></Input>
                </div>
            </div>
            <div className={'flex mt-5 justify-end gap-3'}>
                <Link to={'/users'} className={buttonVariants({ variant: 'secondary' })}>
                    Abbrechen
                </Link>
                <Button variant={'brand'}>Speichern</Button>
            </div>
        </Form>
    );
};
