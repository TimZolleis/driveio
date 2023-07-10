import type { DateTime } from 'luxon';
import { calculateTotalDrivingTime } from '~/utils/lesson/lesson-utils';
import type { DrivingLesson, InstructorData } from '.prisma/client';

export function checkInstructorLimits(
    instructorData: InstructorData,
    lessons: DrivingLesson[],
    date: DateTime
) {
    const duration = calculateTotalDrivingTime(lessons);
    return {
        instructorLimitExceeded: duration > instructorData.dailyDrivingMinutes,
        instructorMinutesRemaining: instructorData.dailyDrivingMinutes - duration,
    };
}
