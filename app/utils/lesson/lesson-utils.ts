import type { DrivingLesson } from '.prisma/client';
import { DateTime, Interval } from 'luxon';

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
                return Interval.fromDateTimes(firstLessonStart, firstLessonEnd).overlaps(
                    Interval.fromDateTimes(secondLessonStart, secondLessonEnd)
                );
            }
            return false;
        });
    });
}

export function getOverlappingAppointments(lessons: DrivingLesson[]) {
    const overlappingLessons = getOverlappingLessons(lessons);
    const sortedAppointments = overlappingLessons.slice().sort((a, b) => {
        return a.start.localeCompare(b.start);
    });

    // Initialize an array to store the overlapping appointment groups
    const overlappingGroups: DrivingLesson[][] = [];

    // Initialize the first group with the first appointment
    overlappingGroups.push([sortedAppointments[0]]);

    // Iterate over the sorted appointments to find overlaps and merge them into groups
    for (let i = 1; i < sortedAppointments.length; i++) {
        const currentAppointment = sortedAppointments[i];
        let foundGroup = false;

        // Check if the current appointment overlaps with any existing group
        for (let j = 0; j < overlappingGroups.length; j++) {
            const group = overlappingGroups[j];
            const lastAppointment = group[group.length - 1];

            if (currentAppointment.start <= lastAppointment.end) {
                // Appointments overlap, add the current appointment to the group
                group.push(currentAppointment);
                foundGroup = true;
                break;
            }
        }

        if (!foundGroup) {
            // Create a new group for the current appointment
            overlappingGroups.push([currentAppointment]);
        }
    }

    return overlappingGroups;
}

export function filterSameDayLessons(
    reference: DrivingLesson,
    overlappingLessons: DrivingLesson[]
) {
    return overlappingLessons.filter((lesson) => {
        return (
            DateTime.fromISO(lesson.start).startOf('day') ===
            DateTime.fromISO(reference.start).startOf('day')
        );
    });
}

export function sortLessonsAscending(lesson1: DrivingLesson, lesson2: DrivingLesson) {
    return lesson1.start.localeCompare(lesson2.start);
}
