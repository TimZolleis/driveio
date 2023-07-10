import { Link, useFetcher } from '@remix-run/react';
import { Input } from '~/components/ui/Input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '~/components/ui/Select';
import { Button, buttonVariants } from '~/components/ui/Button';
import type { AddUserActionData } from '~/routes/_app.users.add';
import { ROLE } from '.prisma/client';
import type { ValidationErrors } from '~/types/general-types';

export const AddUserForm = ({
    action,
    className,
    errors,
}: {
    action?: string;
    className?: string;
    errors?: ValidationErrors;
}) => {
    const fetcher = useFetcher<AddUserActionData>();
    const data = fetcher.data;
    return (
        <fetcher.Form method={'post'} action={action} className={className}>
            <div className={'grid md:grid-cols-2 gap-3'}>
                <Input
                    required
                    name={'firstName'}
                    error={errors?.firstName[0]}
                    placeholder={'Max'}></Input>
                <Input
                    required
                    name={'lastName'}
                    error={errors?.lastName[0]}
                    placeholder={'Mustermann'}></Input>
                <div>
                    <Input
                        required
                        name={'email'}
                        error={errors?.email[0]}
                        placeholder={'max@mustermann.de'}></Input>
                    <p className={'text-destructive text-sm p-1'}>{data?.error}</p>
                </div>
                <Select required name={'role'}>
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
                <Button variant={'brand'}>Hinzufügen</Button>
            </div>
        </fetcher.Form>
    );
};
