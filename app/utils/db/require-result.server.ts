export function requireResult<T>(result: T | null, errorMessage?: string): T {
    if (!result) {
        throw new Error(errorMessage || 'A result is required');
    }
    return result;
}
