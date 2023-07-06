import { cva } from 'class-variance-authority';
import type { LessonStatus } from '@prisma/client';

const statusVariants = cva('px-1 py-1 rounded-md text-xs uppercase', {
    variants: {
        status: {
            CONFIRMED: 'bg-green-500/20 text-green-500',
            REQUESTED: 'bg-amber-500/20 text-amber-500',
            DECLINED: 'bg-red-500/20 text-red-500',
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
