import * as React from 'react';
import { cn } from '~/utils/css';
import { cva } from 'class-variance-authority';
import { Label } from '~/components/ui/Label';
import type { DebouncedFetcher, useDebounceFetcher } from '~/utils/form/debounce-fetcher';
import { animate, motion } from 'framer-motion';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    autosave?: boolean;
    fetcher?: DebouncedFetcher;
    error?: string;
}

export const inputVariants = cva(
    'flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2  focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    {
        variants: {
            variant: {
                default: 'border-input focus-visible:ring-ring',
                error: 'border-red-200 focus-visible:ring-red-500',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
);

const inputAnimationVariants = {
    default: {},
    error: {
        x: [0, 8, 0, -8, 0],
        transition: { ease: ['easeIn', 'easeOut'], duration: 0.2, repeat: 2 },
    },
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, error, autosave, fetcher, ...props }, ref) => {
        return (
            <motion.div variants={inputAnimationVariants} animate={error ? 'error' : 'default'}>
                <input
                    type={type}
                    className={cn(
                        inputVariants({ variant: error ? 'error' : 'default' }),
                        className
                    )}
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
            </motion.div>
        );
    }
);
Input.displayName = 'Input';

export { Input };
