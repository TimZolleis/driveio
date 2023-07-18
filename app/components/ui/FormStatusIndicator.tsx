import React from 'react';
import { Loader } from '~/components/ui/Loader';
import { Check } from 'lucide-react';
import { cn } from '~/utils/css';

interface FormStatusIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
    state: 'idle' | 'loading' | 'submitting';
    position?: 'start' | 'center' | 'end';
}

export const FormStatusIndicator = React.forwardRef<HTMLDivElement, FormStatusIndicatorProps>(
    ({ className, state, position, ...props }, ref) => {
        return (
            <div
                className={cn(
                    'flex w-full',
                    position === 'start'
                        ? 'justify-start'
                        : position === 'center'
                        ? 'justify-center'
                        : position === 'end'
                        ? 'justify-end'
                        : ''
                )}>
                <div
                    ref={ref}
                    className={cn(
                        'rounded-md px-2 py-1 bg-gray-100 text-muted-foreground text-xs font-medium flex items-center gap-1 max-w-max',
                        className
                    )}>
                    {state === 'submitting' && <Loader size={15} />}
                    {state === 'idle' && <Check className={'w-4 h-4'} />}
                    {state === 'submitting' ? 'Wird gespeichert...' : 'Gespeichert'}
                </div>
            </div>
        );
    }
);

FormStatusIndicator.displayName = 'FormStatusIndicator';
