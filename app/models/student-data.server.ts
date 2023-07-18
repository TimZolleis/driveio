import { prisma } from '../../prisma/db';
import type { z } from 'zod';
import type { studentDataSchema } from '~/routes/_app.users_.$userId.data';
import { getSafeISOStringFromDateTime } from '~/utils/luxon/parse-hour-minute';
import { DateTime } from 'luxon';

export async function findStudentData(userId: string, require?: boolean) {
    return prisma.studentData.findUnique({ where: { userId } });
}

export async function upsertStudentData(userId: string, data: z.infer<typeof studentDataSchema>) {
    const dateOfBirth = getSafeISOStringFromDateTime(
        DateTime.fromFormat(data.dateOfBirth, 'dd.MM.yyyy')
    );

    const pickupLat = data.pickupLat ? parseFloat(data.pickupLat) : undefined;
    const pickupLng = data.pickupLng ? parseFloat(data.pickupLng) : undefined;
    const lessonTypeId = data.lessonTypeId === 'auto' ? null : data.lessonTypeId;
    /**
     * We have to do a separate query here since prisma client seems to be buggy when updating the user within the studentData upsert
     */
    const userPromise = prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            enabled: !data.trainingEnd || DateTime.fromISO(data.trainingEnd) > DateTime.now(),
        },
    });
    const studentDataPromise = prisma.studentData.upsert({
        where: { userId: userId },
        create: {
            ...data,
            lessonTypeId,
            dateOfBirth,
            pickupLat,
            pickupLng,
            userId: userId,
        },
        update: {
            ...data,
            lessonTypeId,
            dateOfBirth,
            pickupLat,
            pickupLng,
        },
    });
    return await Promise.all([userPromise, studentDataPromise]);
}
