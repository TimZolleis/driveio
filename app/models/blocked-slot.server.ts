import { prisma } from '../../prisma/db';
import type { BlockedSlot } from '.prisma/client';
import { REPEAT } from '.prisma/client';
import { DateTime, Interval } from 'luxon';
import { getSafeISOStringFromDateTime } from '~/utils/luxon/parse-hour-minute';
import { filterBlockedSlots } from '~/utils/booking/calculate-available-slots.server';
import { optionalStart } from '@remix-run/dev/dist/config/routesConvention';

export async function findBlockedSlots(userId: string) {
    return prisma.blockedSlot.findMany({ where: { userId } });
}

export async function findWeeklyBlockedSlots(userId: string, start: DateTime) {
    const blockedSlots = await findBlockedSlots(userId);
    const res: BlockedSlot[] = [];

    const endDate = start.plus({ days: 7 });

    const daysInWeek = [];
    let currentDate = start;

    while (currentDate < endDate) {
        daysInWeek.push(currentDate);
        currentDate = currentDate.plus({ days: 1 });
    }

    daysInWeek.forEach((day) => {
        blockedSlots.forEach((slot) => {
            const slotStart = DateTime.fromISO(slot.startDate);
            const slotEnd = DateTime.fromISO(slot.endDate);

            if (slot.repeat === REPEAT.DAILY) {
                res.push({
                    ...slot,
                    startDate: getSafeISOStringFromDateTime(
                        day.set({ hour: slotStart.hour, minute: slotStart.minute })
                    ),
                    endDate: getSafeISOStringFromDateTime(
                        day.set({ hour: slotEnd.hour, minute: slotEnd.minute })
                    ),
                });
            }
            if (slot.repeat === REPEAT.WEEKLY && day.weekday === slotStart.weekday) {
                res.push({
                    ...slot,
                    startDate: getSafeISOStringFromDateTime(
                        day.set({ hour: slotStart.hour, minute: slotStart.minute })
                    ),
                    endDate: getSafeISOStringFromDateTime(
                        day.set({ hour: slotEnd.hour, minute: slotEnd.minute })
                    ),
                });
            }
            if (slot.repeat === REPEAT.MONTHLY && day.day === slotStart.day) {
                res.push({
                    ...slot,
                    startDate: getSafeISOStringFromDateTime(
                        day.set({ hour: slotStart.hour, minute: slotStart.minute })
                    ),
                    endDate: getSafeISOStringFromDateTime(
                        day.set({ hour: slotEnd.hour, minute: slotEnd.minute })
                    ),
                });
            }
            if (
                slot.repeat === REPEAT.YEARLY &&
                day.day === slotStart.day &&
                day.month === slotStart.month
            ) {
                res.push({
                    ...slot,
                    startDate: getSafeISOStringFromDateTime(
                        day.set({ hour: slotStart.hour, minute: slotStart.minute })
                    ),
                    endDate: getSafeISOStringFromDateTime(
                        day.set({ hour: slotEnd.hour, minute: slotEnd.minute })
                    ),
                });
            }
        });
    });
    return res;
}

export async function findAllBlockedSlots(
    userId: string,
    start: DateTime,
    end: DateTime,
    selected: DateTime
) {
    const slots = await prisma.blockedSlot
        .findMany({ where: { userId } })
        .then((slots) => slots.filter((slot) => filterBlockedSlots(slot, selected)));
    const repeatingSlots: BlockedSlot[] = [];
    slots.forEach((slot) => {
        switch (slot.repeat) {
            case REPEAT.DAILY: {
                Interval.fromDateTimes(start, end)
                    .splitBy({ days: 1 })
                    .forEach((interval) => {
                        repeatingSlots.push({
                            ...slot,
                            startDate: getSafeISOStringFromDateTime(
                                DateTime.fromISO(slot.startDate).set({
                                    day: interval.start?.day,
                                    month: interval.start?.month,
                                    year: interval.start?.year,
                                })
                            ),
                            endDate: getSafeISOStringFromDateTime(
                                DateTime.fromISO(slot.endDate).set({
                                    day: interval.start?.day,
                                    month: interval.start?.month,
                                    year: interval.start?.year,
                                })
                            ),
                        });
                    });
            }
        }
    });
    return [...slots, ...repeatingSlots];
}
