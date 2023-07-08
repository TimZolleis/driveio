import type { DateTime } from 'luxon';
import { getSafeISOStringFromDateTime } from '~/utils/luxon/parse-hour-minute';
import { LessonStatus } from '@prisma/client';
import { prisma } from '../../prisma/db';

export async function findLessons({
    instructorId,
    date,
}: {
    instructorId: string;
    date: DateTime;
}) {
    return prisma.drivingLesson.findMany({
        where: {
            instructorId,
            start: {
                gte: date.startOf('day').toISO() ?? undefined,
                lt: date.startOf('day').plus({ days: 1 }).toISO() ?? undefined,
            },
            status: 'REQUESTED' || 'CONFIRMED',
        },
    });
}

export async function findStudentLessons(studentId: string, date: DateTime) {
    return prisma.drivingLesson.findMany({
        where: {
            userId: studentId,
            start: {
                gte: date.startOf('day').toISO() ?? undefined,
                lt: date.startOf('day').plus({ day: 1 }).toISO() ?? undefined,
            },
            status: 'REQUESTED' || 'CONFIRMED',
        },
    });
}

interface RequestLessonProps {
    start: DateTime;
    end: DateTime;
    userId: string;
    instructorId: string;
    description?: string;
}

export async function requestLesson({
    start,
    end,
    userId,
    instructorId,
    description,
}: RequestLessonProps) {
    return prisma.drivingLesson.create({
        data: {
            userId,
            instructorId,
            start: getSafeISOStringFromDateTime(start),
            end: getSafeISOStringFromDateTime(end),
            status: LessonStatus.REQUESTED,
            description,
        },
    });
}
