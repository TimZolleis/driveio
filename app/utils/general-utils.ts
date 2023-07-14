import type { Params } from '@remix-run/react';
import { ZodError } from 'zod';
import { json, redirect, TypedResponse } from '@remix-run/node';
import { errors } from '~/messages/errors';

export function requireParameter(parameter: string, parameters: Params) {
    const value = parameters[parameter];
    if (!value) {
        throw new Error(`The parameter ${parameter} is required`);
    }
    return value;
}

export function getQuery(request: Request, query: string) {
    const url = new URL(request.url);
    return url.searchParams.get(query);
}

export function raise(error: string): never {
    throw new Error(error);
}

export function handleActionError(error: unknown) {
    if (error instanceof Response) {
        const url = error.headers.get('location');
        if (url) return redirect(url);
    }

    if (error instanceof ZodError) {
        return json({ formValidationErrors: error.formErrors.fieldErrors });
    }
    if (error instanceof Error) {
        return json({ error: error.message });
    }
    return json({ error: errors.unknown });
}

export function handleModalIntent(formData: FormData, redirectTo: string) {
    const intent = formData.get('intent')?.toString();
    if (intent === 'cancel') {
        throw redirect(redirectTo);
    }
    return intent;
}
