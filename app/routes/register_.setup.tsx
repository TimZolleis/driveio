import { DataFunctionArgs, json, redirect } from '@remix-run/node';
import { destroySession, getSession } from '~/utils/session/session.server';
import { prisma } from '../../prisma/db';
import { requireResult } from '~/utils/db/require-result.server';
import { errors } from '~/messages/errors';
import { DateTime } from 'luxon';
import { Form, Link, useLoaderData, useRouteError } from '@remix-run/react';
import { Password } from '~/components/ui/Password';
import { Button, buttonVariants } from '~/components/ui/Button';
import { Label } from '~/components/ui/Label';
import { zfd } from 'zod-form-data';
import { useRef, useState } from 'react';
import pbkdf2 from 'pbkdf2-passworder';
import { cn } from '~/utils/css';

async function validateRegistration(request: Request) {
    const session = await getSession(request);
    const registrationCode = session.get('registrationCode') as string | undefined;
    if (!registrationCode) {
        throw redirect('/register');
    }
    const registration = await prisma.registration
        .findUnique({
            where: { code: parseInt(registrationCode) },
            include: {
                user: true,
            },
        })
        .then((result) => requireResult(result, errors.code.invalid));
    const issuedAt = session.get('issuedAt') as string | undefined;
    if (
        !issuedAt ||
        DateTime.now()
            .diff(DateTime.fromSeconds(parseFloat(issuedAt)))
            .as('minutes') > 10
    ) {
        throw new Error(errors.registration.expired);
    }
    return registration;
}

export const loader = async ({ request, params }: DataFunctionArgs) => {
    const registration = await validateRegistration(request);
    return json({ registration });
};

const setPasswordSchema = zfd.formData({ password: zfd.text(), confirmPassword: zfd.text() });

export const action = async ({ request, params }: DataFunctionArgs) => {
    const { password, confirmPassword } = setPasswordSchema.parse(await request.formData());
    if (password !== confirmPassword) {
        throw new Error(errors.registration.password.noMatch);
    }
    const registration = await validateRegistration(request);
    if (DateTime.fromJSDate(registration.createdAt).diff(DateTime.now()).get('weeks') > 2) {
        throw new Error(errors.registration.invalidAttempt);
    }
    const hashedPassword = await pbkdf2.hash(password);
    await prisma.user.update({
        where: { id: registration.userId },
        data: { password: hashedPassword },
    });
    await prisma.registration.delete({ where: { id: registration.id } });
    return redirect('/login', {
        headers: {
            'Set-Cookie': await destroySession(request),
        },
    });
};

function getImageUrl(firstName: string, lastName: string) {
    const imageUrl = new URL('https://ui-avatars.com/api');
    imageUrl.searchParams.set('bold', 'true');
    imageUrl.searchParams.set('rounded', 'true');
    imageUrl.searchParams.set('name', `${firstName} ${lastName}`);
    imageUrl.searchParams.set('background', '85deff');
    imageUrl.searchParams.set('color', '0e5dbe');
    return imageUrl;
}

export const SetupPage = () => {
    const { registration } = useLoaderData<typeof loader>();
    const passwordRef = useRef<HTMLInputElement>(null);
    const confirmPasswordRef = useRef<HTMLInputElement>(null);
    const [passwordMatch, setPasswordMatch] = useState(true);

    const checkPasswordMatch = () => {
        setPasswordMatch(passwordRef.current?.value === confirmPasswordRef.current?.value);
    };

    return (
        <main className={'min-h-screen w-full'}>
            <div
                className={'h-screen container w-screen flex flex-col items-center justify-center'}>
                <div className={'flex items-center justify-center flex-col mb-3'}>
                    <img
                        className={'h-12'}
                        src={getImageUrl(
                            registration.user.firstName,
                            registration.user.lastName
                        ).toString()}
                        alt=''
                    />
                </div>
                <h1 className={'text-2xl font-semibold tracking-tight'}>Einrichtung</h1>
                <p className={'text-sm text-muted-foreground'}>
                    Richte hier ein Passwort ein, mit welchem du dich in Zukunft anmeldest
                </p>
                <Form method={'post'} className={'grid max-w-md w-full mt-5 gap-2'}>
                    <Label>Passwort</Label>
                    <Password
                        minLength={6}
                        onInput={checkPasswordMatch}
                        ref={passwordRef}
                        name={'password'}
                        revealable={false}
                        type={'password'}
                        placeholder={'*********'}
                    />
                    <Label>Passwort wiederholen</Label>
                    <Password
                        minLength={6}
                        onInput={checkPasswordMatch}
                        ref={confirmPasswordRef}
                        name={'confirmPassword'}
                        revealable={false}
                        type={'password'}
                        placeholder={'*********'}
                    />
                    {!passwordMatch && (
                        <p className={'text-sm text-destructive'}>
                            {errors.registration.password.noMatch}
                        </p>
                    )}

                    <Button
                        disabled={
                            !passwordMatch ||
                            !passwordRef.current ||
                            passwordRef.current.value.length < 6
                        }>
                        Speichern
                    </Button>
                </Form>
                <Link
                    className={
                        'px-8 mt-5 text-center text-sm text-muted-foreground underline underline-offset-4'
                    }
                    to={'/login'}>
                    Du bist bereits registriert? Anmelden
                </Link>
            </div>
        </main>
    );
};

export const ErrorBoundary = () => {
    const error = useRouteError();
    return (
        <main className={'min-h-screen w-full'}>
            <div
                className={'h-screen container w-screen flex flex-col items-center justify-center'}>
                <div
                    className={
                        'flex flex-col items-center justify-center border border-border rounded-md p-5'
                    }>
                    <h1 className={'text-2xl font-semibold tracking-tight'}>Fehler</h1>
                    <p className={'text-sm text-muted-foreground max-w-md text-center'}>
                        {error instanceof Error ? error.message : errors.unknown}
                    </p>

                    <Link
                        className={cn(buttonVariants({ variant: 'ghost' }), 'mt-2')}
                        to={'/register'}>
                        Zurück
                    </Link>
                </div>
            </div>
        </main>
    );
};

export default SetupPage;
