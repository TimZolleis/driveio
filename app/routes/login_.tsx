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
import { SerializedZodError } from '~/types/SerializedZodError';

const formDataSchema = zfd.formData({
    email: zfd.text(z.string({ required_error: errors.login.email.required })),
    password: zfd.text(z.string({ required_error: errors.login.password.required })),
});

export function isZodError(
    data?: ActionData,
    error?: Error | SerializedZodError
): error is SerializedZodError {
    return !!data?.isZodError;
}

type ActionData = {
    error?: SerializedZodError | Error;
    isZodError?: boolean;
};

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
            throw new Error(errors.login.password.invalid);
        }
        return redirect('/', {
            headers: {
                'Set-Cookie': await setUser(request, user),
            },
        });
    } catch (error) {
        return json({ error, isZodError: error instanceof ZodError });
    }
};

const LoginPage = () => {
    const data = useActionData<ActionData>();
    return (
        <main className={'min-h-screen w-full'}>
            <div
                className={'h-screen container w-screen flex flex-col items-center justify-center'}>
                <h1 className={'text-2xl font-semibold tracking-tight'}>Anmeldung</h1>
                <p className={'text-sm text-muted-foreground'}>
                    Bitte melde dich mit deinen Zugangsdaten an
                </p>
                <Form method={'post'} className={'grid max-w-md w-full mt-5 gap-2'}>
                    <Input name={'email'} placeholder={'name@email.com'}></Input>
                    <Password
                        name={'password'}
                        revealable={false}
                        type={'password'}
                        placeholder={'*********'}
                    />
                    <Button>Anmelden</Button>
                </Form>
                <div className={'text-center mt-2'}>
                    {isZodError(data, data?.error)
                        ? data.error.issues.map((issue) => (
                              <p className={'text-sm text-destructive'} key={issue.message}>
                                  {issue.message}
                              </p>
                          ))
                        : data?.error?.message}
                </div>
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
