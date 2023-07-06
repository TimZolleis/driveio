import type { InstructorData, ManagementData, StudentData, User } from '.prisma/client';
import { prisma } from '../../../prisma/db';
import { requireResult } from '~/utils/db/require-result.server';
import { errors } from '~/messages/errors';

export function isStudentData(
    data: (StudentData | InstructorData | ManagementData) | null,
    user: User
): data is StudentData {
    return user.role === 'STUDENT';
}

export function isInstructorData(
    data: StudentData | InstructorData | ManagementData | null,
    user: User
): data is InstructorData {
    return user.role === 'INSTRUCTOR';
}

export async function getInstructor(user: User) {
    if (user.role !== 'STUDENT') {
        throw new Error('Instructors can only be found on students');
    }
    const instructorId = await prisma.studentData
        .findUnique({ where: { userId: user.id } })
        .then((result) => requireResult(result, errors.student.noStudentData))
        .then((result) => result.instructorId);
    if (!instructorId) {
        throw new Error(errors.student.noInstructor);
    }
    return prisma.user
        .findUnique({ where: { id: instructorId } })
        .then((result) => requireResult(result, errors.user.notFound));
}
