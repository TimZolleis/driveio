import { Form } from '@remix-run/react';
import { Label } from '~/components/ui/Label';
import { DatePicker } from '~/components/ui/DatePicker';
import { Input } from '~/components/ui/Input';
import { DateTime } from 'luxon';
import { Textarea } from '~/components/ui/TextArea';
import type { ValidationErrorActionData, ValidationErrors } from '~/types/general-types';
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
import type { User } from '.prisma/client';

function safeParseInt(string: string) {
    try {
        return parseInt(string);
    } catch (error) {
        return 90;
    }
}

export const AddLessonForm = ({
    students,
    date,
    time,
    errors,
}: {
    students: User[];
    date?: DateTime;
    time?: string;
    errors?: ValidationErrors;
}) => {
    const [duration, setDuration] = useState('90');
    const [isCustomDuration, setCustomDuration] = useState(false);
    const startInputRef = useRef<HTMLInputElement>(null);

    return (
        <>
            <div className={'grid gap-3'}>
                <div>
                    <Label>Datum</Label>
                    <DatePicker
                        error={errors?.date?.[0]}
                        name={'date'}
                        defaultValue={date ? date.toJSDate() : new Date()}></DatePicker>
                </div>
                <div className={'grid grid-cols-2 gap-3'}>
                    <div>
                        <Label>Anfang</Label>
                        <Input
                            ref={startInputRef}
                            error={errors?.start?.[0]}
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
                        <p className={'text-xs text-destructive '}>{errors?.duration?.[0]}</p>
                    </div>

                    <div>
                        <Label>Fahrschüler</Label>
                        <StudentComboBox students={students} />
                        <p className={'text-xs text-destructive '}>{errors?.student?.[0]}</p>
                    </div>
                </div>

                <div>
                    <Label>Beschreibung</Label>
                    <Textarea name={'description'} />
                </div>
            </div>
            <p className={'text-sm text-destructive'}>{errors?.error}</p>
        </>
    );
};
