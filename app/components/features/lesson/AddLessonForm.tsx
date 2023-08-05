import { Form } from '@remix-run/react';
import { Label } from '~/components/ui/Label';
import { DatePicker } from '~/components/ui/DatePicker';
import { Input } from '~/components/ui/Input';
import { DateTime } from 'luxon';
import { Textarea } from '~/components/ui/TextArea';
import type {
    TypedValidationErrors,
    ValidationErrorActionData,
    ValidationErrors,
} from '~/types/general-types';
import { useRef, useState } from 'react';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '~/components/ui/Select';
import { StudentComboBox } from '~/components/features/user/student/StudentComboBox';
import type { LessonType, User } from '.prisma/client';
import { zfd } from 'zod-form-data';
import { timeFormatSchema } from '~/routes/_app.me.blocked-slots.add';
import { z } from 'zod';
import { transformErrors } from '~/utils/general-utils';

function safeParseInt(string: string) {
    try {
        return parseInt(string);
    } catch (error) {
        return 90;
    }
}

interface AddLessonFormProps {
    students: User[];
    date?: DateTime;
    time?: string;
    errors?: TypedValidationErrors<z.infer<typeof addLessonSchema>>;
    lessonTypes: LessonType[];
}

export const addLessonSchema = zfd.formData({
    start: zfd.text(timeFormatSchema),
    duration: zfd.text(),
    date: zfd.text(),
    description: zfd.text(z.string().optional()),
    student: zfd.text(),
    lessonType: zfd.text(),
});
export const AddLessonForm = ({
    students,
    date,
    time,
    errors,
    lessonTypes,
}: AddLessonFormProps) => {
    const [duration, setDuration] = useState('90');
    const [isCustomDuration, setCustomDuration] = useState(false);
    const startInputRef = useRef<HTMLInputElement>(null);
    const transformedErrors = transformErrors(errors);

    return (
        <>
            <div className={'grid gap-3'}>
                <div>
                    <Label>Datum</Label>
                    <DatePicker
                        error={transformedErrors?.date}
                        name={'date'}
                        defaultValue={date ? date.toJSDate() : new Date()}></DatePicker>
                </div>
                <div className={'grid grid-cols-2 gap-3'}>
                    <div>
                        <Label>Anfang</Label>
                        <Input
                            ref={startInputRef}
                            error={transformedErrors?.start}
                            name={'start'}
                            defaultValue={time || DateTime.now().toFormat('HH:mm')}
                        />
                        <p className={'text-xs p-1 text-muted-foreground'}>
                            Ende:{' '}
                            {startInputRef.current
                                ? DateTime.fromFormat(startInputRef.current.value, 'HH:mm')
                                      .plus({ minute: safeParseInt(duration) })
                                      .toFormat('HH:mm')
                                : time
                                ? DateTime.fromFormat(time, 'HH:mm')
                                      .plus({ minute: safeParseInt(duration) })
                                      .toFormat('HH:mm')
                                : DateTime.now().toFormat('HH:mm')}
                        </p>
                    </div>

                    <div>
                        <Label>Dauer</Label>
                        <input type='hidden' name={'duration'} value={duration} />
                        <div className={'flex items-center gap-2'}>
                            <Select
                                defaultValue={duration}
                                onValueChange={(value) => {
                                    if (value === 'other') {
                                        setCustomDuration(true);
                                    } else {
                                        setCustomDuration(false);
                                        setDuration(value);
                                    }
                                }}>
                                <SelectTrigger className='w-[180px]'>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem value='90'>90 Minuten</SelectItem>
                                        <SelectItem value='135'>135 Minuten</SelectItem>
                                        <SelectItem value='other'>Andere</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            {isCustomDuration && (
                                <Input
                                    className={'w-[60px]'}
                                    onChange={(event) => setDuration(event.target.value)}
                                />
                            )}
                        </div>
                        <p className={'text-xs text-destructive '}>{transformedErrors?.duration}</p>
                    </div>

                    <div>
                        <Label>Fahrschüler</Label>
                        <StudentComboBox students={students} />
                        <p className={'text-xs text-destructive '}>{transformedErrors?.student}</p>
                    </div>
                    <div>
                        <Label>Stundentyp</Label>
                        <Select name={'lessonType'} defaultValue={'auto'}>
                            <SelectTrigger className='w-[180px]'>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem value='auto'>Automatisch</SelectItem>
                                    {lessonTypes.map((type) => (
                                        <SelectItem key={type.id} value={type.id}>
                                            {type.name}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <p className={'text-xs text-destructive '}>
                            {transformedErrors?.lessonType}
                        </p>
                    </div>
                </div>

                <div>
                    <Label>Beschreibung</Label>
                    <Textarea name={'description'} />
                </div>
            </div>
            <p className={'text-sm text-destructive'}>{transformedErrors?.description}</p>
        </>
    );
};
