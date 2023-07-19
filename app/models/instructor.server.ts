import { findStudentData } from '~/models/student-data.server';
import { requireResult } from '~/utils/db/require-result.server';
import { raise } from '~/utils/general-utils';
import { errors } from '~/messages/errors';

export async function findInstructorId(studentId: string) {
    const studentData = await findStudentData(studentId).then(requireResult);
    const instructorId = studentData.instructorId ?? raise(errors.student.noStudentData);
    return studentData.instructorId ?? raise(errors.student.noStudentData);
}
