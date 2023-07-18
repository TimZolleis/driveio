import { DateTime } from 'luxon';
import { getSafeISOStringFromDateTime } from '~/utils/luxon/parse-hour-minute';
import { LessonStatus } from '@prisma/client';
import { prisma } from '../../prisma/db';
import type { DrivingLesson } from '.prisma/client';

export async function findLesson(lessonId: string) {
    return prisma.drivingLesson.findUnique({ where: { id: lessonId }, include: { student: true } });
}

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
        include: {
            student: {
                include: {
                    studentData: true,
                },
            },
        },
    });
}

export async function findWeeklyLessons({
    instructorId,
    start,
}: {
    instructorId: string;
    start?: DateTime;
}) {
    return prisma.drivingLesson.findMany({
        where: {
            instructorId,
            start: {
                gte: start
                    ? start.startOf('week').toISO() ?? undefined
                    : DateTime.now().startOf('week').toISO() ?? undefined,
                lte: start
                    ? start.endOf('week').toISO() ?? undefined
                    : DateTime.now().endOf('week').toISO() ?? undefined,
            },
        },
        include: {
            student: true,
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

export async function declineLesson({
    lessonId,
    cancelledById,
    description,
}: {
    lessonId: DrivingLesson['id'];
    cancelledById: string;
    description: DrivingLesson['description'];
}) {
    return prisma.drivingLesson.update({
        where: { id: lessonId },
        data: {
            description,
            status: LessonStatus.DECLINED,
            cancelledAt: getSafeISOStringFromDateTime(DateTime.now()),
            cancelledBy: cancelledById,
        },
    });
}
