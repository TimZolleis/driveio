export type ValidationErrorActionData = {
    formValidationErrors: ValidationErrors;
    error?: string;
};

export type SchemaValidationErrorActionData<T> = {
    formValidationErrors: {
        [P in keyof T]?: string[];
    };
};

export type ValidationErrors = {
    [p: string]: string[];
};
