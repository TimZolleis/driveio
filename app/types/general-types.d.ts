export type ValidationErrorActionData = {
    formValidationErrors: ValidationErrors;
    error?: string;
};

export type ValidationErrors = {
    [p: string]: string[];
};
