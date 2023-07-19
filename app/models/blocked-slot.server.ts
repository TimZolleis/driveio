import { prisma } from '../../prisma/db';
import type { BlockedSlot } from '.prisma/client';
import { REPEAT } from '.prisma/client';
import { DateTime, Interval } from 'luxon';
import { getSafeISOStringFromDateTime } from '~/utils/luxon/parse-hour-minute';
import { filterBlockedSlots } from '~/utils/booking/calculate-available-slots.server';

export async function findBlockedSlots(userId: string) {
    return prisma.blockedSlot.findMany({ where: { userId } });
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
