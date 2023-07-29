import type { LessonType, LicenseClass, StudentData, User } from '.prisma/client';
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
import { DateTime } from 'luxon';
import { useDebounceFetcher } from '~/utils/form/debounce-fetcher';
import { useDoubleCheck } from '~/utils/general-utils';
import { Lock, Unlock } from 'lucide-react';
import type { ValidationErrorActionData, ValidationErrors } from '~/types/general-types';
import { FormStatusIndicator } from '~/components/ui/FormStatusIndicator';
import { zfd } from 'zod-form-data';
import { z } from 'zod';
import { errors } from '~/messages/errors';
import type { ReactNode } from 'react';
import { useState } from 'react';

interface StudentDataFormProps {
    defaultValues?: DefaultValues;
    instructors: User[];
    licenseClasses: LicenseClass[];
    lessonTypes: LessonType[];
    errors?: ValidationErrors;
    currentAddress?: BingMapsLocation;
    children?: ReactNode;
}

type DefaultValues = z.infer<typeof studentDataSchema>;

export const studentDataSchema = zfd.formData({
    dateOfBirth: zfd.text(z.string({ required_error: errors.form.notEmpty })),
    trainingBegin: zfd.text(z.string().optional()),
    trainingEnd: zfd.text(z.string().optional()),
    licenseClassId: zfd.text(),
    lessonTypeId: zfd.text(),
    trainingPhase: zfd.text(z.enum(['EXAM_PREPARATION', 'DEFAULT', 'EXTENSIVE'])),
    instructorId: zfd.text(z.string({ required_error: errors.form.notEmpty })),
    pickupLat: zfd.text(z.string().optional()),
    pickupLng: zfd.text(z.string().optional()),
    waitingTime: zfd.numeric(),
});

function validateDateOfBirth(value: string) {
    try {
        const date = DateTime.fromFormat(value, 'dd.MM.yyyy');
        const age = DateTime.now().diff(date, 'years').years;
        if (age < 15) {
            return 'Benutzer ist unter 15 Jahre alt';
        }
        return undefined;
    } catch (error) {
        return errors.form.invalidDate;
    }
}
export const StudentDataForm = ({
    defaultValues,
    errors,
    instructors,
    licenseClasses,
    lessonTypes,
    currentAddress,
    children,
}: StudentDataFormProps) => {
    const fetcher = useFetcher<LocationApiRoute>();
    const [dateOfBirthError, setDateOfBirthError] = useState<string | undefined>();
    const formFetcher = useDebounceFetcher<ValidationErrorActionData>();
    const doubleCheck = useDoubleCheck();
    const autosave = !!defaultValues;
    const Comp = autosave ? Form : formFetcher.Form;

    return (
        <>
            {autosave && <FormStatusIndicator state={formFetcher.state} position={'end'} />}
            <Comp method={'post'}>
                <div className={'grid lg:grid-cols-2 gap-6 gap-x-2'}>
                    <div className={'grid gap-2 col-span-2'}>
                        <Label>Geburtsdatum</Label>
                        <Input
                            error={
                                formFetcher.data?.formValidationErrors?.dateOfBirth?.[0] ||
                                dateOfBirthError
                            }
                            autosave={autosave}
                            fetcher={formFetcher}
                            onChange={(event) => {
                                setDateOfBirthError(validateDateOfBirth(event.target.value));
                            }}
                            name={'dateOfBirth'}
                            defaultValue={
                                defaultValues?.dateOfBirth
                                    ? DateTime.fromISO(defaultValues?.dateOfBirth).toFormat(
                                          'dd.MM.yyyy'
                                      )
                                    : DateTime.now().toFormat('dd.MM.yyyy')
                            }></Input>

                        <p className={'text-xs text-destructive'}>{errors?.dateOfBirth?.[0]}</p>
                    </div>
                    <div className={'grid gap-2'}>
                        <Label>Ausbildungsbeginn</Label>
                        <DatePicker
                            autosave={autosave}
                            fetcher={formFetcher}
                            name={'trainingBegin'}
                            defaultValue={
                                defaultValues?.trainingBegin
                                    ? new Date(defaultValues.trainingBegin)
                                    : new Date()
                            }
                        />
                    </div>
                    <div className={'grid gap-2'}>
                        <Label>Ausbildungsende</Label>
                        <DatePicker
                            autosave={autosave}
                            fetcher={formFetcher}
                            defaultValue={
                                defaultValues?.trainingEnd
                                    ? new Date(defaultValues.trainingEnd)
                                    : undefined
                            }
                            name={'trainingEnd'}
                        />
                    </div>
                    <div className={'grid gap-2'}>
                        <Label>Ausbildungsklasse</Label>
                        <Select
                            error={formFetcher.data?.formValidationErrors?.licenseClassId?.[0]}
                            autosave={autosave}
                            fetcher={formFetcher}
                            defaultValue={defaultValues?.licenseClassId}
                            name={'licenseClassId'}>
                            <SelectTrigger className='w-full'>
                                <SelectValue placeholder='Ausbildungsklasse wählen' />
                            </SelectTrigger>
                            <SelectContent position={'item-aligned'}>
                                {licenseClasses.map((licenseClass) => (
                                    <SelectItem key={licenseClass.id} value={licenseClass.id}>
                                        {licenseClass.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className={'grid gap-2'}>
                        <Label>Fahrtstundentyp</Label>
                        <Select
                            error={formFetcher.data?.formValidationErrors?.trainingClass?.[0]}
                            autosave={autosave}
                            fetcher={formFetcher}
                            defaultValue={defaultValues?.lessonTypeId || 'auto'}
                            name={'lessonTypeId'}>
                            <SelectTrigger className='w-full'>
                                <SelectValue placeholder='Ausbildungsklasse wählen' />
                            </SelectTrigger>
                            <SelectContent position={'item-aligned'}>
                                <SelectItem value={'auto'}>Automatisch</SelectItem>
                                {lessonTypes.map((lessonType) => (
                                    <SelectItem key={lessonType.id} value={lessonType.id}>
                                        {lessonType.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className={'grid gap-2'}>
                        <Label>Ausbildungsphase</Label>
                        <Select
                            error={formFetcher.data?.formValidationErrors?.trainingPhase?.[0]}
                            autosave={autosave}
                            fetcher={formFetcher}
                            defaultValue={defaultValues?.trainingPhase || 'DEFAULT'}
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
                    <div className={'grid gap-2'}>
                        <Label>Fahrlehrer</Label>
                        <Select
                            error={formFetcher.data?.formValidationErrors?.instructorId?.[0]}
                            autosave={autosave}
                            fetcher={formFetcher}
                            defaultValue={defaultValues?.instructorId || undefined}
                            name={'instructorId'}>
                            <SelectTrigger className='w-full'>
                                <SelectValue placeholder='Fahrlehrer wählen' />
                            </SelectTrigger>
                            <SelectContent>
                                {instructors.map((instructor) => (
                                    <SelectItem key={instructor.id} value={instructor.id}>
                                        {`${instructor.firstName} ${instructor.lastName}`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className={'grid gap-2 w-full'}>
                        <Label>Abholort</Label>
                        <AddressCombobox
                            error={formFetcher.data?.formValidationErrors?.pickupLocation?.[0]}
                            autosave={autosave}
                            fetcher={formFetcher}
                            defaultLocation={currentAddress}
                            results={fetcher.data?.results || []}
                            onInput={(query) => fetcher.load(`/api/location?query=${query}`)}
                        />
                    </div>
                    <div className={'grid gap-2'}>
                        <Label>Wartezeit</Label>
                        <Input
                            error={formFetcher.data?.formValidationErrors?.waitingTime?.[0]}
                            autosave={autosave}
                            fetcher={formFetcher}
                            name={'waitingTime'}
                            defaultValue={defaultValues?.waitingTime || '30'}
                        />
                    </div>
                </div>
                {!autosave && <div className={'flex justify-end mt-5'}>{children}</div>}
            </Comp>
            {autosave && (
                <form method={'post'}>
                    <div className={'flex mt-5 justify-start gap-3'}>
                        {(defaultValues?.trainingEnd &&
                            DateTime.fromISO(defaultValues.trainingEnd) >= DateTime.now()) ||
                        !defaultValues?.trainingEnd ? (
                            <Button
                                name={'intent'}
                                value={'end-training'}
                                variant={'destructive'}
                                {...doubleCheck.getButtonProps()}>
                                {doubleCheck.doubleCheck ? (
                                    'Ausbildung wirklich beenden?'
                                ) : (
                                    <div className={'flex items-center gap-2 '}>
                                        <Lock className={'w-4 h-4'} />
                                        <p>Ausbildung beenden</p>
                                    </div>
                                )}
                            </Button>
                        ) : (
                            <Button
                                name={'intent'}
                                value={'start-training'}
                                {...doubleCheck.getButtonProps()}>
                                {doubleCheck.doubleCheck ? (
                                    'Ausbildung wirklich beginnen?'
                                ) : (
                                    <div className={'flex items-center gap-2 '}>
                                        <Unlock className={'w-4 h-4'} />
                                        <p>Ausbildung beginnen</p>
                                    </div>
                                )}
                            </Button>
                        )}
                    </div>
                </form>
            )}
        </>
    );
};
