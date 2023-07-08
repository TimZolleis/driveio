import type { DateTime } from 'luxon';
import { calculateTotalLessonDuration } from '~/utils/lesson/calculate-total-lesson-duration';
import type { DrivingLesson, InstructorData } from '.prisma/client';

export function checkInstructorLimits(
    instructorData: InstructorData,
    lessons: DrivingLesson[],
    date: DateTime
) {
    const duration = calculateTotalLessonDuration(lessons);
    return {
        instructorLimitExceeded: duration > instructorData.dailyDrivingMinutes,
        instructorMinutesRemaining: instructorData.dailyDrivingMinutes - duration,
    };
}
