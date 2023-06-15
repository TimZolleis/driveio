import * as React from 'react';
import { cn } from '~/utils/css';
import { InputProps, inputVariants } from '~/components/ui/Input';
import { EyeIcon } from 'lucide-react';

export interface PasswordProps extends React.InputHTMLAttributes<HTMLInputElement> {
    revealable: boolean;
}

export const Password = React.forwardRef<HTMLInputElement, PasswordProps>(
    ({ className, type, revealable, ...props }, ref) => {
        return (
            <div className={'flex items-center gap-2'}>
                <input
                    type={type}
                    className={cn(inputVariants(), className)}
                    ref={ref}
                    {...props}
                />
                {revealable && <EyeIcon />}
            </div>
        );
    }
);
