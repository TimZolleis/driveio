import React from 'react';
import { cn } from '~/utils/css';

const FormDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
    return (
        <p ref={ref} className={cn('text-muted-foreground text-xs mt-2', className)} {...props}></p>
    );
});

FormDescription.displayName = 'FormDescription';
export { FormDescription };
