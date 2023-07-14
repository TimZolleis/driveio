import { Form, Link } from '@remix-run/react';
import { Input } from '~/components/ui/Input';
import { Button, buttonVariants } from '~/components/ui/Button';
import type { LessonWithStudent } from '~/routes/_app.lessons';
import type { ValidationErrorActionData, ValidationErrors } from '~/types/general-types';
import { Label } from '~/components/ui/Label';
import { DatePicker } from '~/components/ui/DatePicker';
import { Textarea } from '~/components/ui/TextArea';
import { DateTime } from 'luxon';

export const EditLessonForm = ({
    lesson,
    errors,
}: {
    lesson: LessonWithStudent;
    errors?: ValidationErrors;
}) => {
    return (
        <>
            <div className={'grid  gap-3'}>
                <div>
                    <Label>Datum</Label>
                    <DatePicker
                        error={errors?.date?.[0]}
                        name={'date'}
                        defaultValue={new Date(lesson.start)}></DatePicker>
                </div>
                <div className={'grid grid-cols-2 gap-3'}>
                    <div>
                        <Label>Anfang</Label>
                        <Input
                            error={errors?.start?.[0]}
                            name={'start'}
                            defaultValue={DateTime.fromISO(lesson.start).toFormat('HH:mm')}
                        />
                    </div>

                    <div>
                        <Label>Ende</Label>
                        <Input
                            error={errors?.end?.[0]}
                            name={'end'}
                            defaultValue={DateTime.fromISO(lesson.end).toFormat('HH:mm')}
                        />
                    </div>
                </div>
                <div>
                    <Label>Beschreibung</Label>
                    <Textarea name={'description'} defaultValue={lesson.description ?? undefined} />
                </div>
            </div>
            <p className={'text-sm text-destructive'}>{errors?.error}</p>
        </>
    );
};
