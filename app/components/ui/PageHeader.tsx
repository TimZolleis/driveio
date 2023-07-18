import type { ReactNode } from 'react';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import { Check } from 'lucide-react';
import { Loader } from '~/components/ui/Loader';

const pageHeaderVariants = cva('text-primary', {
    variants: {
        variant: {
            xl: 'text-2xl font-semibold',
            lg: 'text-lg font-medium',
        },
    },
    defaultVariants: {
        variant: 'xl',
    },
});

export const PageHeader = ({
    variant,
    children,
    showSubmission,
    submission,
}: {
    variant?: VariantProps<typeof pageHeaderVariants>['variant'];
    children?: ReactNode;
    showSubmission?: boolean;
    submission?: 'submitting' | 'loading' | 'idle';
}) => {
    return (
        <div className={'flex items-center gap-2'}>
            <h1 className={pageHeaderVariants({ variant })}>{children}</h1>
        </div>
    );
};
