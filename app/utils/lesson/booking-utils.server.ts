import { findStudentData } from '~/models/student-data.server';
import { findInstructorData } from '~/models/instructor-data.server';
import { requireResult } from '~/utils/db/require-result.server';
import { DateTime } from 'luxon';
import { findInstructorLessons, findStudentLessons } from '~/models/lesson.server';
import type { BlockedSlot, DrivingLesson } from '.prisma/client';
import { REPEAT, TrainingPhase } from '.prisma/client';
import { calculateTotalDrivingTime } from '~/utils/lesson/lesson-utils';
import { LessonStatus } from '@prisma/client';
import { findAllBlockedSlots } from '~/models/blocked-slot.server';
import { prisma } from '../../../prisma/db';
import { checkOverlap, filterBlockedSlots } from '~/utils/booking/calculate-available-slots.server';

export async function checkStudentLimits(studentId: string, date: DateTime) {
    const studentData = await findStudentData(studentId).then(requireResult);
    const instructorData = await findInstructorData(studentData.instructorId || undefined).then(
        requireResult
    );
    const lessons = await findStudentLessons(studentId, date);
    console.log(lessons);
    const maxStudentLessons =
        studentData.trainingPhase === TrainingPhase.EXAM_PREPARATION
            ? instructorData.maxExampreparationLessons
            : studentData.trainingPhase === TrainingPhase.EXTENSIVE
            ? instructorData.maxExtensiveLessons
            : instructorData.maxDefaultLessons;
    return {
        studentData,
        instructorData,
        remainingLessonsForStudent: maxStudentLessons - lessons.length,
    };
}

export async function checkInstructorLimits(instructorId: string, date: DateTime) {
    const instructorData = await findInstructorData(instructorId).then(requireResult);
    const lessons = await findInstructorLessons(instructorId, date);
    const duration = calculateTotalDrivingTime(lessons);
    return {
        instructorData,
        remainingMinutesForInstructor: instructorData.dailyDrivingMinutes - duration,
    };
}

const trainingPhaseHierarchy = {
    [TrainingPhase.DEFAULT]: 0,
    [TrainingPhase.EXTENSIVE]: 1,
    [TrainingPhase.EXAM_PREPARATION]: 2,
};

export async function findBlockedLessons(
    instructorId: string,
    date: DateTime,
    trainingPhase: TrainingPhase
) {
    const lessons = await findInstructorLessons(instructorId, date);
    return lessons.filter((lesson) => {
        const lessonTrainingPhase = lesson.student?.studentData?.trainingPhase;
        if (
            lesson.status === LessonStatus.CONFIRMED ||
            lessonTrainingPhase === TrainingPhase.EXAM_PREPARATION ||
            lessonTrainingPhase === trainingPhase
        ) {
            return true;
        }
        return (
            trainingPhaseHierarchy[lessonTrainingPhase || TrainingPhase.DEFAULT] >
            trainingPhaseHierarchy[trainingPhase]
        );
    });
}

export function convertLessonToSlot(lesson: DrivingLesson) {
    return { start: lesson.start, end: lesson.end, id: lesson.id };
}

export function convertBlockedSlotToSlot(blockedSlot: BlockedSlot) {
    return {
        start: blockedSlot.startDate,
        end: blockedSlot.endDate,
        id: blockedSlot.id,
    };
}

export async function checkOverlapWithLessons(
    instructorId: string,
    start: DateTime,
    end: DateTime
) {
    const lessons = await prisma.drivingLesson.findMany({
        where: {
            instructorId,
            start: {
                gte: start.toISO() ?? undefined,
                lt: end.toISO() ?? undefined,
            },
        },
    });
    return lessons.length > 0;
}

export async function checkOverlapWithBlockedSlots(
    instructorId: string,
    start: DateTime,
    end: DateTime
) {
    const blockedSlots = await prisma.blockedSlot.findMany({
        where: {
            userId: instructorId,
        },
    });
    const filtered = blockedSlots
        .filter((slot) => filterBlockedSlots(slot, start))
        .filter((slot) => {
            const slotStart = DateTime.fromISO(slot.startDate);
            const slotEnd = DateTime.fromISO(slot.endDate);
            return checkOverlap({ start: slotStart, end: slotEnd }, { start, end });
        });
    return filtered.length > 0;
}

export async function checkSlotAvailability(studentId: string, start: DateTime, end: DateTime) {
    const duration = end.diff(start).as('minutes');
    const { studentData, instructorData, remainingLessonsForStudent } = await checkStudentLimits(
        studentId,
        start
    );
    const { remainingMinutesForInstructor } = await checkInstructorLimits(
        instructorData.userId,
        start
    );
    if (remainingLessonsForStudent === 0 || remainingMinutesForInstructor < duration) {
        return false;
    }
    const overlapsWithBlocked = await checkOverlapWithBlockedSlots(
        instructorData.userId,
        start,
        end
    );
    if (overlapsWithBlocked) {
        return overlapsWithBlocked;
    }
    const overlapsWithBooked = await checkOverlapWithLessons(instructorData.userId, start, end);
    if (overlapsWithBooked) {
        return overlapsWithBooked;
    }
    return true;
}
