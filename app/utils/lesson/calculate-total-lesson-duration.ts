import type { DrivingLesson } from '.prisma/client';
import { DateTime } from 'luxon';

export function calculateTotalLessonDuration(lessons: DrivingLesson[]) {
    let minutes = 0;
    lessons.forEach((lesson) => {
        const start = DateTime.fromISO(lesson.start);
        const end = DateTime.fromISO(lesson.end);
        const lessonDuration = end.diff(start).as('minutes');
        minutes += lessonDuration;
    });
    return minutes;
}
