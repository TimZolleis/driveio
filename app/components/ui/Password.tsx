import * as React from 'react';
import { cn } from '~/utils/css';
import { inputVariants } from '~/components/ui/Input';
import { EyeIcon } from 'lucide-react';
import { Label } from '~/components/ui/Label';

export interface PasswordProps extends React.InputHTMLAttributes<HTMLInputElement> {
    revealable: boolean;
    error?: string;
}

export const Password = React.forwardRef<HTMLInputElement, PasswordProps>(
    ({ className, type, revealable, error, ...props }, ref) => {
        return (
            <>
                <div className={'flex items-center gap-2'}>
                    <input
                        type={type}
                        className={cn(inputVariants(), className)}
                        ref={ref}
                        {...props}
                    />
                    {revealable && <EyeIcon />}
                </div>
                <Label variant={'description'} color={'destructive'}>
                    {error}
                </Label>
            </>
        );
    }
);
Password.displayName = 'Password';
