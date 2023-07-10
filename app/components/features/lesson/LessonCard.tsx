import type { LessonWithStudent } from '~/routes/_app.lessons';
import { DateTime } from 'luxon';
import { LessonPlanningButtons } from '~/components/features/lesson/LessonPlanningButtons';
import { LessonStatusBadge } from '~/components/features/lesson/LessonStatus';
import { cn } from '~/utils/css';
import { LessonStatus } from '@prisma/client';
import { AlertTriangle } from 'lucide-react';

export const LessonCard = ({
    lesson,
    overlaps,
    highlight,
    enablePlanning,
}: {
    lesson: LessonWithStudent;
    overlaps?: boolean;
    highlight?: boolean;
    enablePlanning?: boolean;
}) => {
    const lessonStart = DateTime.fromISO(lesson.start);
    const lessonEnd = DateTime.fromISO(lesson.end);
    return (
        <div
            className={cn(
                'flex items-center border rounded-md p-4 gap-4',
                lesson.status === LessonStatus.DECLINED
                    ? 'bg-neutral-100 opacity-75'
                    : highlight
                    ? 'bg-red-100/30'
                    : 'bg-white'
            )}>
            {overlaps && <AlertTriangle className={'text-red-500'}></AlertTriangle>}
            <div className='space-y-1'>
                <div className={'flex items-center gap-2'}>
                    <p className={'text-sm font-medium leading-none'}>
                        {lesson.student?.firstName} {lesson.student?.lastName}
                    </p>
                    <LessonStatusBadge status={lesson.status} />
                </div>
                <p className='text-sm text-muted-foreground'>{lesson.student.email}</p>
            </div>
            <div className={cn('ml-auto font-medium', overlaps ? 'text-red-500' : 'text-primary')}>
                {lessonStart.toFormat('HH:mm')} - {lessonEnd.toFormat('HH:mm')}
            </div>

            {enablePlanning && (
                <div className={'px-4'}>
                    <LessonPlanningButtons lesson={lesson} />
                </div>
            )}
        </div>
    );
};
