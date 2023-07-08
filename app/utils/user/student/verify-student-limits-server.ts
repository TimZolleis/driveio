import type { InstructorData, StudentData } from '.prisma/client';
import { findStudentLessons } from '~/models/lesson.server';
import type { DateTime } from 'luxon';

export async function checkStudentLimits(
    studentId: string,
    studentData: StudentData,
    instructorData: InstructorData,
    date: DateTime
) {
    const lessons = await findStudentLessons(studentId, date);
    const maxStudentLessons =
        studentData.trainingPhase === 'EXTENSIVE'
            ? instructorData.maxExtensiveLessons
            : studentData.trainingPhase === 'EXAM_PREPARATION'
            ? instructorData.maxExampreparationLessons
            : instructorData.maxDefaultLessons;
    return {
        studentLimitExceeded: lessons.length >= maxStudentLessons,
        studentLessonsRemaining: maxStudentLessons - lessons.length,
    };
}
