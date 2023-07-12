import { Input } from '~/components/ui/Input';
import { Password } from '~/components/ui/Password';
import { Button } from '~/components/ui/Button';
import { Form, Link, useActionData, useNavigation } from '@remix-run/react';
import type { DataFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { zfd } from 'zod-form-data';
import { z } from 'zod';
import { errors } from '~/messages/errors';
import { checkPassword, getUser, setUser } from '~/utils/user/user.server';
import { Label } from '~/components/ui/Label';
import { useDebounceFetcher } from '~/utils/form/debounce-fetcher';
import { getQuery, handleActionError, raise } from '~/utils/general-utils';
import { findUserByEmail } from '~/models/user.server';
import { commitSession, getSession } from '~/utils/session/session.server';
import { Loader } from 'lucide-react';
import { motion } from 'framer-motion';

const loginSchema = zfd.formData({
    password: zfd.text(z.string({ required_error: errors.login.password.required })),
});

export const loader = async ({ request }: DataFunctionArgs) => {
    const user = await getUser(request);
    if (user) {
        return redirect('/');
    }
    const email = getQuery(request, 'email');
    const foundUser = email ? await findUserByEmail(email) : undefined;
    const session = await getSession(request);
    if (email) {
        session.flash('loginEmail', email);
    }

    return json(
        { isValidUser: !!foundUser },
        {
            headers: {
                'Set-Cookie': await commitSession(session),
            },
        }
    );
};

export const action = async ({ request }: DataFunctionArgs) => {
    const formData = await request.formData();
    try {
        const session = await getSession(request);
        const email = session.get('loginEmail') ?? raise(errors.login.email.required);
        const { password } = loginSchema.parse(formData);
        const user = (await findUserByEmail(email)) ?? raise(errors.login.email.invalid);
        const isValidPassword = await checkPassword(user, password);
        if (!isValidPassword) {
            throw new Error(errors.login.password.invalid);
        }

        return redirect('/', {
            headers: {
                'Set-Cookie': await setUser(request, user),
            },
        });
    } catch (error) {
        return handleActionError(error);
    }
};

const LoginPage = () => {
    const fetcher = useDebounceFetcher<typeof loader>();
    const isValidUser = fetcher.data?.isValidUser;
    const data = useActionData();
    const formValidationErrors = data?.formValidationErrors;
    const navigation = useNavigation();
    return (
        <main className={'min-h-screen w-full'}>
            <div
                className={'h-screen container w-screen flex flex-col items-center justify-center'}>
                <h1 className={'text-2xl font-semibold tracking-tight'}>Anmeldung</h1>
                <p className={'text-sm text-muted-foreground'}>
                    Bitte melde dich mit deinen Zugangsdaten an
                </p>
                <fetcher.Form method={'get'} className={'grid max-w-md w-full mt-5 gap-2'}>
                    <Label>Email</Label>
                    <Input
                        fetcher={fetcher}
                        autosave={true}
                        name={'email'}
                        placeholder={'name@email.com'}
                        error={formValidationErrors?.email}></Input>
                    {!isValidUser && (
                        <Button isLoading={fetcher.state === 'submitting'}>Weiter</Button>
                    )}
                </fetcher.Form>
                {isValidUser && (
                    <Form method={'post'} className={'grid max-w-md w-full mt-5 gap-2'}>
                        <Label>Passwort</Label>
                        <Password
                            error={formValidationErrors?.password}
                            name={'password'}
                            revealable={false}
                            type={'password'}
                            placeholder={'*********'}
                        />
                        <Button isLoading={navigation.state !== 'idle'}>Anmelden</Button>
                    </Form>
                )}
                <Label variant={'description'} color={'destructive'} className={'mt-2'}>
                    {data?.error}
                </Label>
                <div className={'text-center mt-2'}></div>
                <Link
                    className={
                        'px-8 mt-5 text-center text-sm text-muted-foreground underline underline-offset-4'
                    }
                    to={'/register'}>
                    Du hast einen Einladungscode? Registrieren
                </Link>
            </div>
        </main>
    );
};

export default LoginPage;
