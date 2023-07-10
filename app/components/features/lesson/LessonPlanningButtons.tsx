import type { LessonWithStudent } from '~/routes/_app.lessons';
import { Form } from '@remix-run/react';
import { Check, Edit3, X } from 'lucide-react';
import { LessonStatus } from '@prisma/client';
import { useNavigate } from 'react-router';

export const LessonPlanningButtons = ({ lesson }: { lesson: LessonWithStudent }) => {
    const navigate = useNavigate();

    return (
        <div className={'flex items-center gap-2'}>
            <button
                onClick={() => navigate(`/lessons/plan/${lesson.id}/confirm`)}
                disabled={lesson.status === LessonStatus.CONFIRMED}
                className={'w-8 h-8 group rounded-full border flex items-center justify-center'}>
                <Check className={'text-green-500 w-4 h-4 group-disabled:text-gray-200'}></Check>
            </button>
            <button
                onClick={() => navigate(`/lessons/plan/${lesson.id}/edit`)}
                className={'group w-8 h-8 rounded-full border flex items-center justify-center'}>
                <Edit3 className={'text-amber-500 w-4 h-4 group-disabled:text-gray-200'}></Edit3>
            </button>
            <button
                onClick={() => navigate(`/lessons/plan/${lesson.id}/decline`)}
                disabled={lesson.status === LessonStatus.DECLINED}
                className={'group w-8 h-8 rounded-full border flex justify-center items-center'}>
                <X className={'text-red-500 w-4 h-4 group-disabled:text-gray-200'}></X>
            </button>
        </div>
    );
};
