import type { DrivingSchool } from '.prisma/client';
import { prisma } from '../../prisma/db';

export async function findDrivingSchool({
    drivingSchoolId,
}: {
    drivingSchoolId: DrivingSchool['id'];
}) {
    return prisma.drivingSchool.findUnique({ where: { id: drivingSchoolId } });
}
