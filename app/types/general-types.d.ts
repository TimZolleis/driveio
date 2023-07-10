export type ValidationErrors = {
    [p: string]: string[];
} & { error?: string };
