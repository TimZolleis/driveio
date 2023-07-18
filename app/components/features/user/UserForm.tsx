import type { User } from '.prisma/client';
import { Input } from '~/components/ui/Input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '~/components/ui/Select';
import { Button, buttonVariants } from '~/components/ui/Button';
import { Form, Link, useFetcher } from '@remix-run/react';
import { Label } from '~/components/ui/Label';
import { FormDescription } from '~/components/ui/FormDescription';
import login_ from '~/routes/login_';
import { useDebounceFetcher } from '~/utils/form/debounce-fetcher';
import { FormStatusIndicator } from '~/components/ui/FormStatusIndicator';

interface UserFormProps {
    user?: User;
    errors?: {
        [key: string]: string[];
    };
}

export const UserForm = ({ user, errors }: UserFormProps) => {
    const fetcher = useDebounceFetcher();
    return (
        <>
            <fetcher.Form method={'post'}>
                <FormStatusIndicator state={fetcher.state} position={'end'} />
                <div className={'grid gap-3'}>
                    <div>
                        <Label>Vorname</Label>
                        <Input
                            fetcher={fetcher}
                            autosave={true}
                            required
                            name={'firstName'}
                            defaultValue={user?.firstName}
                            placeholder={'Max'}
                        />
                    </div>
                    <div>
                        <Label>Nachname</Label>
                        <Input
                            fetcher={fetcher}
                            autosave={true}
                            required
                            name={'lastName'}
                            defaultValue={user?.lastName}
                            placeholder={'Mustermann'}
                        />
                    </div>
                    <div>
                        <Label>Email</Label>
                        <Input
                            fetcher={fetcher}
                            autosave={true}
                            required
                            name={'email'}
                            placeholder={'max@mustermann.de'}
                            defaultValue={user?.email}></Input>
                        <p className={'text-destructive text-sm p-1'}>{errors?.email[0]}</p>
                    </div>
                    <div>
                        <Label>Rolle</Label>
                        <Select
                            disabled={!!user}
                            name={'role'}
                            defaultValue={user?.role.toLowerCase()}
                            autosave={true}
                            fetcher={fetcher}>
                            <SelectTrigger className='w-full'>
                                <SelectValue placeholder='Rolle' />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='student'>Fahrschüler</SelectItem>
                                <SelectItem value='instructor'>Fahrlehrer</SelectItem>
                                <SelectItem value='management'>Verwaltung</SelectItem>
                            </SelectContent>
                        </Select>
                        <Label variant={'description'}>
                            Aus Sicherheitsgründen kann die Rolle eines Benutzers nicht mehr
                            geändert werden.
                        </Label>
                    </div>
                </div>
            </fetcher.Form>
        </>
    );
};
