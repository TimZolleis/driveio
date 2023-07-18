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
import type { ValidationErrorActionData } from '~/types/general-types';
import { FormStatusIndicator } from '~/components/ui/FormStatusIndicator';

interface StudentDataFormProps {
    studentData?: StudentData;
    instructors: User[];
    licenseClasses: LicenseClass[];
    lessonTypes: LessonType[];
    errors?: {
        [key: string]: string[];
    };
    currentAddress?: BingMapsLocation | undefined;
}

export const StudentDataForm = ({
    studentData,
    errors,
    instructors,
    licenseClasses,
    lessonTypes,
    currentAddress,
}: StudentDataFormProps) => {
    const fetcher = useFetcher<LocationApiRoute>();
    const formFetcher = useDebounceFetcher<ValidationErrorActionData>();
    const doubleCheck = useDoubleCheck();
    const autosave = !!studentData;

    return (
        <>
            <FormStatusIndicator state={formFetcher.state} position={'end'} />
            <formFetcher.Form method={'post'}>
                <div className={'grid gap-2'}>
                    <Label>Geburtsdatum</Label>
                    <Input
                        error={formFetcher.data?.formValidationErrors?.dateOfBirth?.[0]}
                        autosave={autosave}
                        fetcher={formFetcher}
                        name={'dateOfBirth'}
                        defaultValue={
                            studentData?.dateOfBirth
                                ? DateTime.fromISO(studentData?.dateOfBirth).toFormat('dd.MM.yyyy')
                                : DateTime.now().toFormat('dd.MM.yyyy')
                        }></Input>

                    <p className={'text-xs text-destructive'}>{errors?.dateOfBirth[0]}</p>
                </div>
                <div className={'py-3'}>
                    <Separator />
                </div>
                <div className={'grid grid-cols-2 gap-2'}>
                    <div className={'grid gap-2'}>
                        <Label>Ausbildungsbeginn</Label>
                        <DatePicker
                            autosave={autosave}
                            fetcher={formFetcher}
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
                            autosave={autosave}
                            fetcher={formFetcher}
                            defaultValue={
                                studentData?.trainingEnd
                                    ? new Date(studentData.trainingEnd)
                                    : undefined
                            }
                            name={'trainingEnd'}
                        />
                    </div>
                    <div className={'grid grid-cols-2 gap-2'}>
                        <div className={'grid gap-2'}>
                            <Label>Ausbildungsklasse</Label>
                            <Select
                                error={formFetcher.data?.formValidationErrors?.trainingClass?.[0]}
                                autosave={autosave}
                                fetcher={formFetcher}
                                defaultValue={studentData?.licenseClassId}
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
                                defaultValue={studentData?.lessonTypeId || 'auto'}
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
                    </div>
                    <div className={'grid gap-2'}>
                        <Label>Ausbildungsphase</Label>
                        <Select
                            error={formFetcher.data?.formValidationErrors?.trainingPhase?.[0]}
                            autosave={autosave}
                            fetcher={formFetcher}
                            defaultValue={studentData?.trainingPhase || 'DEFAULT'}
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
                    <Select
                        error={formFetcher.data?.formValidationErrors?.instructorId?.[0]}
                        autosave={autosave}
                        fetcher={formFetcher}
                        defaultValue={studentData?.instructorId || undefined}
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

                <div className={'py-3'}>
                    <Separator />
                </div>
                <div className={'flex items-center gap-2'}>
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
                            defaultValue={studentData?.waitingTime || '30'}
                        />
                    </div>
                </div>
                {!autosave && (
                    <div className={'flex justify-end mt-5'}>
                        <Button>Speichern</Button>
                    </div>
                )}
            </formFetcher.Form>
            {autosave && (
                <form method={'post'}>
                    <div className={'flex mt-5 justify-start gap-3'}>
                        {(studentData?.trainingEnd &&
                            DateTime.fromISO(studentData.trainingEnd) >= DateTime.now()) ||
                        !studentData?.trainingEnd ? (
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
