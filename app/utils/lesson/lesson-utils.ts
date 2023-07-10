import type { DrivingLesson } from '.prisma/client';
import { DateTime } from 'luxon';
import { checkOverlap } from '~/utils/booking/calculate-available-slots.server';

export function calculateTotalDrivingTime(lessons: DrivingLesson[]) {
    let minutes = 0;
    lessons.forEach((lesson) => {
        const start = DateTime.fromISO(lesson.start);
        const end = DateTime.fromISO(lesson.end);
        const lessonDuration = end.diff(start).as('minutes');
        minutes += lessonDuration;
    });
    return minutes;
}

export function countIndividualStudents(lessons: DrivingLesson[]) {
    const uniqueIds: { [key: string]: boolean } = {};
    const filtered = lessons.filter((lesson) => {
        if (!uniqueIds[lesson.userId]) {
            uniqueIds[lesson.userId] = true;
            return true;
        }
        return false;
    });
    return filtered.length;
}

export function getOverlappingLessons(lessons: DrivingLesson[]) {
    return lessons.filter((firstLesson) => {
        const firstLessonStart = DateTime.fromISO(firstLesson.start);
        const firstLessonEnd = DateTime.fromISO(firstLesson.end);
        return lessons.some((secondLesson) => {
            const secondLessonStart = DateTime.fromISO(secondLesson.start);
            const secondLessonEnd = DateTime.fromISO(secondLesson.end);
            if (firstLesson.id !== secondLesson.id) {
                return checkOverlap(
                    { start: firstLessonStart, end: firstLessonEnd },
                    {
                        start: secondLessonStart,
                        end: secondLessonEnd,
                    }
                );
            }
            return false;
        });
    });
}

export function sortLessonsAscending(lesson1: DrivingLesson, lesson2: DrivingLesson) {
    return lesson1.start.localeCompare(lesson2.start);
}
