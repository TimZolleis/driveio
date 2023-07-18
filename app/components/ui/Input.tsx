import * as React from 'react';
import { cn } from '~/utils/css';
import { cva } from 'class-variance-authority';
import { Label } from '~/components/ui/Label';
import type { DebouncedFetcher, useDebounceFetcher } from '~/utils/form/debounce-fetcher';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    autosave?: boolean;
    fetcher?: DebouncedFetcher;
    error?: string;
}

export const inputVariants = cva(
    'flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
);

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, error, autosave, fetcher, ...props }, ref) => {
        return (
            <div>
                <input
                    type={type}
                    className={cn(inputVariants({}), className)}
                    ref={ref}
                    onChange={(event) => {
                        if (autosave) {
                            fetcher?.debounceSubmit(event.currentTarget.form, {
                                replace: true,
                                debounceTimeout: 500,
                            });
                        }
                        props.onChange?.(event);
                    }}
                    onBlur={(event) => {
                        if (autosave) {
                            fetcher?.debounceSubmit(event.currentTarget.form, {
                                replace: true,
                            });
                        }
                        props.onBlur?.(event);
                    }}
                    {...props}
                />
                <Label variant={'description'} color={'destructive'}>
                    {error}
                </Label>
            </div>
        );
    }
);
Input.displayName = 'Input';

export { Input };
