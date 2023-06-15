import { User } from '.prisma/client';
import { Input } from '~/components/ui/Input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '~/components/ui/Select';
import { Button, buttonVariants } from '~/components/ui/Button';
import { Form, Link } from '@remix-run/react';

interface UserFormProps {
    user: User;
    errors?: {
        [key: string]: string[];
    };
}

export const UserForm = ({ user, errors }: UserFormProps) => {
    return (
        <Form method={'post'} className={'mt-5'}>
            <div className={'grid md:grid-cols-2 gap-3'}>
                <Input
                    required
                    name={'firstName'}
                    defaultValue={user.firstName}
                    placeholder={'Max'}></Input>
                <Input
                    required
                    name={'lastName'}
                    defaultValue={user.lastName}
                    placeholder={'Mustermann'}></Input>
                <div>
                    <Input
                        required
                        name={'email'}
                        placeholder={'max@mustermann.de'}
                        defaultValue={user.email}></Input>
                    <p className={'text-destructive text-sm p-1'}>{errors?.email[0]}</p>
                </div>
                <div>
                    <Select name={'role'} defaultValue={user.role.toLowerCase()} disabled={true}>
                        <SelectTrigger className='w-full'>
                            <SelectValue placeholder='Rolle' />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value='student'>Fahrschüler</SelectItem>
                            <SelectItem value='instructor'>Fahrlehrer</SelectItem>
                            <SelectItem value='management'>Verwaltung</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className={'text-muted-foreground text-xs mt-2'}>
                        Aus Sicherheitsgründen kann die Rolle eines Benutzers nicht mehr geändert
                        werden.
                    </p>
                </div>
            </div>
            <div className={'flex gap-3 justify-end mt-5'}>
                <Link
                    to={`/users/${user.id}/delete`}
                    className={buttonVariants({ variant: 'destructive' })}>
                    Löschen
                </Link>
                <Button variant={'brand'}>Speichern</Button>
            </div>
        </Form>
    );
};
