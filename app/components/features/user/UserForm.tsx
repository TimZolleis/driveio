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
import { Label } from '~/components/ui/Label';
import { FormDescription } from '~/components/ui/FormDescription';

interface UserFormProps {
    user: User;
    errors?: {
        [key: string]: string[];
    };
}

export const UserForm = ({ user, errors }: UserFormProps) => {
    return (
        <Form method={'post'} className={'w-full'}>
            <div className={'grid gap-3'}>
                <div>
                    <Label>Vorname</Label>
                    <Input
                        required
                        name={'firstName'}
                        defaultValue={user.firstName}
                        placeholder={'Max'}
                    />
                </div>
                <div>
                    <Label>Nachname</Label>
                    <Input
                        required
                        name={'lastName'}
                        defaultValue={user.lastName}
                        placeholder={'Mustermann'}
                    />
                </div>
                <div>
                    <Label>Email</Label>
                    <Input
                        required
                        name={'email'}
                        placeholder={'max@mustermann.de'}
                        defaultValue={user.email}></Input>
                    <p className={'text-destructive text-sm p-1'}>{errors?.email[0]}</p>
                </div>
                <div>
                    <Label>Rolle</Label>
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
                    <Label variant={'description'}>
                        Aus Sicherheitsgründen kann die Rolle eines Benutzers nicht mehr geändert
                        werden.
                    </Label>
                </div>
            </div>
            <div className={'flex gap-3 justify-between mt-5'}>
                <Link
                    className={buttonVariants({ variant: 'destructive' })}
                    to={`/users/${user.id}/delete`}>
                    Benutzer löschen
                </Link>
                <div className={'flex justify-self-end gap-3'}>
                    <Link to={`/users`} className={buttonVariants({ variant: 'outline' })}>
                        Abbruch
                    </Link>
                    <Button variant={'brand'}>Speichern</Button>
                </div>
            </div>
        </Form>
    );
};
