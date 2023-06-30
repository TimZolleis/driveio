import type { InstructorData, ManagementData, StudentData, User } from '.prisma/client';

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
