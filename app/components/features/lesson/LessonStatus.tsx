import { cva } from 'class-variance-authority';
import type { LessonStatus } from '@prisma/client';

const statusVariants = cva('rounded-md text-xs uppercase', {
    variants: {
        status: {
            CONFIRMED: 'text-green-500',
            REQUESTED: 'text-amber-500',
            DECLINED: 'text-red-500',
        },
    },
});

const statusTranslation = {
    REQUESTED: 'Angefragt',
    CONFIRMED: 'Bestätigt',
    DECLINED: 'Abgesagt',
};

export const LessonStatusBadge = ({ status }: { status: LessonStatus }) => {
    return <div className={statusVariants({ status })}>{statusTranslation[status]}</div>;
};
