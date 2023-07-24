import { findStudentData } from '~/models/student-data.server';
import { requireResult } from '~/utils/db/require-result.server';
import { raise } from '~/utils/general-utils';
import { errors } from '~/messages/errors';
import { prisma } from '../../prisma/db';
import { ROLE } from '.prisma/client';

export async function findInstructorId(studentId: string) {
    const studentData = await findStudentData(studentId).then(requireResult);
    const instructorId = studentData.instructorId ?? raise(errors.student.noStudentData);
    return studentData.instructorId ?? raise(errors.student.noStudentData);
}
export async function getInstructors(drivingSchoolId: string) {
    return prisma.user.findMany({ where: { role: ROLE.INSTRUCTOR, drivingSchoolId } });
}
