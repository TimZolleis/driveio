import { DateTime } from 'luxon';
import { checkOverlap, filterBlockedSlots } from '~/utils/booking/calculate-available-slots.server';
import { prisma } from '../../../prisma/db';
import { findInstructorLessons } from '~/models/lesson.server';

interface CheckSlotProps {
    date: DateTime;
    start: DateTime;
    end: DateTime;
    instructorId: string;
}

export async function isSlotAvailable({ date, start, end, instructorId }: CheckSlotProps) {
    const overlapsBlocked = await checkBlockOverlap({ date, start, end, instructorId });
    const overlapsBooked = await checkBookingOverlap({ date, start, end, instructorId });
    return !(overlapsBlocked || overlapsBooked);
}

export async function checkBlockOverlap({ date, start, end, instructorId }: CheckSlotProps) {
    const blockedSlots = await prisma.blockedSlot
        .findMany({ where: { userId: instructorId } })
        .then((result) => result.filter((slot) => filterBlockedSlots(slot, date)));
    return blockedSlots.some((slot) => {
        const blockStart = DateTime.fromISO(slot.startDate);
        const blockEnd = DateTime.fromISO(slot.endDate);
        return checkOverlap({ start, end }, { start: blockStart, end: blockEnd });
    });
}

export async function checkBookingOverlap({ date, start, end, instructorId }: CheckSlotProps) {
    const lessons = await findInstructorLessons({ instructorId, date });
    return lessons.some((lesson) => {
        const lessonStart = DateTime.fromISO(lesson.start);
        const lessonEnd = DateTime.fromISO(lesson.end);
        return checkOverlap({ start, end }, { start: lessonStart, end: lessonEnd });
    });
}
