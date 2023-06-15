import { useFetcher } from '@remix-run/react';
import { Input } from '~/components/ui/Input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '~/components/ui/Select';
import { Button } from '~/components/ui/Button';
import type { AddUserActionData } from '~/routes/_app.users.add';

export const AddUserForm = ({ action, className }: { action?: string; className?: string }) => {
    const fetcher = useFetcher<AddUserActionData>();
    const data = fetcher.data;
    return (
        <fetcher.Form method={'post'} action={action} className={className}>
            <div className={'grid md:grid-cols-2 gap-3'}>
                <Input required name={'firstName'} placeholder={'Max'}></Input>
                <Input required name={'lastName'} placeholder={'Mustermann'}></Input>
                <div>
                    <Input required name={'email'} placeholder={'max@mustermann.de'}></Input>
                    <p className={'text-destructive text-sm p-1'}>{data?.error}</p>
                </div>
                <Select required name={'role'}>
                    <SelectTrigger className='w-full'>
                        <SelectValue placeholder='Rolle' />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value='student'>Fahrschüler</SelectItem>
                        <SelectItem value='instructor'>Fahrlehrer</SelectItem>
                        <SelectItem value='management'>Verwaltung</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className={'flex gap-3 justify-end mt-5'}>
                <Button variant={'brand'}>Hinzufügen</Button>
            </div>
        </fetcher.Form>
    );
};
