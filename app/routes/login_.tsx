import { Input } from '~/components/ui/Input';
import { Password } from '~/components/ui/Password';
import { Button } from '~/components/ui/Button';
import { Form, Link, useActionData } from '@remix-run/react';
import type { DataFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { zfd } from 'zod-form-data';
import { z, ZodError } from 'zod';
import { prisma } from '../../prisma/db';
import { errors } from '~/messages/errors';
import { checkPassword, setUser } from '~/utils/user/user.server';
import { Label } from '~/components/ui/Label';

const formDataSchema = zfd.formData({
    email: zfd.text(z.string({ required_error: errors.login.email.required })),
    password: zfd.text(z.string({ required_error: errors.login.password.required })),
});

export const action = async ({ request }: DataFunctionArgs) => {
    try {
        const { email, password } = formDataSchema.parse(await request.formData());
        const user = await prisma.user.findUnique({ where: { email: email } }).then((user) => {
            if (!user) {
                throw new Error(errors.login.email.invalid);
            }
            return user;
        });
        if (!(await checkPassword(user, password))) {
            return json({ error: errors.login.password.invalid });
        }
        return redirect('/', {
            headers: {
                'Set-Cookie': await setUser(request, user),
            },
        });
    } catch (error) {
        if (error instanceof ZodError) {
            return json({ formValidationErrors: error.formErrors.fieldErrors });
        }
        if (error instanceof Error) {
            return json({ error: error.message });
        }
        return json({ error: errors.unknown });
    }
};

const LoginPage = () => {
    const data = useActionData();
    const formValidationErrors = data?.formValidationErrors;
    return (
        <main className={'min-h-screen w-full'}>
            <div
                className={'h-screen container w-screen flex flex-col items-center justify-center'}>
                <h1 className={'text-2xl font-semibold tracking-tight'}>Anmeldung</h1>
                <p className={'text-sm text-muted-foreground'}>
                    Bitte melde dich mit deinen Zugangsdaten an
                </p>
                <Form method={'post'} className={'grid max-w-md w-full mt-5 gap-2'}>
                    <Input
                        name={'email'}
                        placeholder={'name@email.com'}
                        error={formValidationErrors?.email}></Input>
                    <Password
                        error={formValidationErrors?.password}
                        name={'password'}
                        revealable={false}
                        type={'password'}
                        placeholder={'*********'}
                    />
                    <Button>Anmelden</Button>
                </Form>
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
