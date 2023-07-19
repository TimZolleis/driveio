import { Form, Link, useActionData } from '@remix-run/react';
import { CodeInput } from '~/components/features/code/CodeInput';
import { Button } from '~/components/ui/Button';
import type { DataFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { zfd } from 'zod-form-data';
import { z, ZodError } from 'zod';
import type { SerializedZodError } from '~/types/SerializedZodError';
import { errors } from '~/messages/errors';
import { prisma } from '../../prisma/db';
import { requireResult } from '~/utils/db/require-result.server';
import { commitSession, getSession } from '~/utils/session/session.server';
import { DateTime } from 'luxon';

type ActionData = {
    error?: string | SerializedZodError;
};

function isZodError(error?: string | SerializedZodError): error is SerializedZodError {
    return typeof error !== 'string';
}

const codeSchema = zfd.formData({
    code: zfd.repeatable(
        z.array(zfd.text(z.string({ required_error: errors.code.required }))).min(6)
    ),
});

export const action = async ({ request }: DataFunctionArgs) => {
    try {
        const formData = codeSchema.parse(await request.formData());
        const code = formData.code.join('');
        const registration = await prisma.registration
            .findUnique({
                where: { code: parseInt(code) },
            })
            .then((result) => requireResult(result, errors.code.invalid));
        const session = await getSession(request);
        session.set('registrationCode', registration.code);
        session.set('issuedAt', DateTime.now().toSeconds());
        return redirect('/register/setup', {
            headers: {
                'Set-Cookie': await commitSession(session),
            },
        });
    } catch (error) {
        if (error instanceof Error || error instanceof ZodError) {
            return json({ error: error instanceof ZodError ? error : error.message });
        }
        return json({ error: errors.unknown });
    }
};

const RegistrationPage = () => {
    const data = useActionData<ActionData>();
    return (
        <main className={'min-h-screen w-full'}>
            <div
                className={'h-screen container w-screen flex flex-col items-center justify-center'}>
                <h1 className={'text-2xl font-semibold tracking-tight'}>Registrierung</h1>
                <p className={'text-sm text-muted-foreground max-w-md text-center'}>
                    Bitte gib hier deinen Registrierungscode ein, den du von deiner Fahrschule
                    erhalten hast.
                </p>
                <Form method={'post'} className={'grid max-w-md w-full mt-5 gap-2'}>
                    <CodeInput name={'code'} />
                    <p className={'text-sm text-destructive'}>
                        {isZodError(data?.error) ? data?.error?.issues.pop()?.message : data?.error}
                    </p>
                    <Button className={'mt-2'}>Registrieren</Button>
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
export default RegistrationPage;
