import { Input } from '~/components/ui/Input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '~/components/ui/Select';
import { ROLE } from '.prisma/client';
import type { ValidationErrors } from '~/types/general-types';
import { Label } from '~/components/ui/Label';
import z from 'zod';
import { zfd } from 'zod-form-data';

export const createUserSchema = zfd.formData({
    firstName: zfd.text(),
    lastName: zfd.text(),
    email: zfd.text(),
    role: zfd.text(z.enum(['INSTRUCTOR', 'MANAGEMENT', 'STUDENT'])),
});
export const GeneralUserDataForm = ({
    defaultValues,
    errors,
}: {
    defaultValues?: z.infer<typeof createUserSchema>;
    errors?: ValidationErrors;
}) => {
    return (
        <div className={'grid gap-6 lg:gap-x-2'}>
            <div className={'grid gap-2'}>
                <Label>Vorname</Label>
                <Input
                    defaultValue={defaultValues?.firstName}
                    name={'firstName'}
                    error={errors?.firstName[0]}
                    placeholder={'Max'}
                />
            </div>
            <div className={'grid gap-2'}>
                <Label>Nachname</Label>
                <Input
                    defaultValue={defaultValues?.lastName}
                    name={'lastName'}
                    error={errors?.lastName[0]}
                    placeholder={'Mustermann'}
                />
            </div>
            <div className={'grid gap-2'}>
                <Label>Email</Label>
                <Input
                    defaultValue={defaultValues?.email}
                    name={'email'}
                    error={errors?.email[0]}
                    placeholder={'max@mustermann.de'}
                />
            </div>
            <div className={'grid gap-2'}>
                <Label>Rolle</Label>
                <div>
                    <Select
                        required
                        name={'role'}
                        defaultValue={defaultValues?.role || ROLE.STUDENT}>
                        <SelectTrigger className='w-full'>
                            <SelectValue placeholder='Rolle' />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ROLE.STUDENT}>Fahrschüler</SelectItem>
                            <SelectItem value={ROLE.INSTRUCTOR}>Fahrlehrer</SelectItem>
                            <SelectItem value={ROLE.MANAGEMENT}>Verwaltung</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
};
