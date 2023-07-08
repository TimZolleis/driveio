import type { Params } from '@remix-run/react';

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
