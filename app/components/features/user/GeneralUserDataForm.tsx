import { Form, Link } from '@remix-run/react';
import { Input } from '~/components/ui/Input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '~/components/ui/Select';
import { Button, buttonVariants } from '~/components/ui/Button';
import type { User } from '.prisma/client';
import { ROLE } from '.prisma/client';
import type { ValidationErrors } from '~/types/general-types';

export const GeneralUserDataForm = ({
    user,
    action,
    className,
    errors,
}: {
    user?: User | null;
    action?: string;
    className?: string;
    errors?: ValidationErrors;
}) => {
    return (
        <Form method={'post'} action={action} className={className}>
            <div className={'grid md:grid-cols-2 gap-3'}>
                <Input
                    defaultValue={user?.firstName}
                    required
                    name={'firstName'}
                    error={errors?.firstName[0]}
                    placeholder={'Max'}></Input>
                <Input
                    defaultValue={user?.lastName}
                    required
                    name={'lastName'}
                    error={errors?.lastName[0]}
                    placeholder={'Mustermann'}></Input>
                <div>
                    <Input
                        defaultValue={user?.email}
                        required
                        name={'email'}
                        error={errors?.email[0]}
                        placeholder={'max@mustermann.de'}></Input>
                    <p className={'text-destructive text-sm p-1'}>{errors?.error}</p>
                </div>
                <Select required name={'role'} defaultValue={user?.role}>
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
            <p className={'text-sm text-destructive'}>{errors?.error}</p>
            <div className={'flex gap-3 justify-end mt-5'}>
                <Link className={buttonVariants({ variant: 'outline' })} to={'/users'}>
                    Abbruch
                </Link>
                <Button variant={'brand'} name={'intent'} value={'createUser'}>
                    Weiter
                </Button>
            </div>
        </Form>
    );
};
