import { parseHourAndMinuteToDateTime } from '~/utils/luxon/parse-hour-minute';
import { DateTime, Duration, Interval } from 'luxon';
import type { Blocking } from '.prisma/client';

export interface TimeSlot {
    index: number;
    start: string | null;
    end: string | null;
}

export function getAllAvailableSlots(start: string, end: string, slotSize: number) {
    const startTime = parseHourAndMinuteToDateTime(start);
    const endTime = parseHourAndMinuteToDateTime(end);
    const slotDuration = Duration.fromObject({ minutes: slotSize });
    const slots: TimeSlot[] = [];
    let current = startTime;
    let index = 0;
    while (current < endTime) {
        const slotEndTime = current.plus(slotDuration);
        if (slotEndTime > endTime) {
            break;
        }
        const slot = {
            index: index,
            start: current.toISO(),
            end: slotEndTime.toISO(),
        };
        slots.push(slot);
        index++;
        current = slotEndTime;
    }
    return slots;
}

export function filterBlockedSlots(slot: Blocking, selectedDate: DateTime) {
    const startDate = DateTime.fromISO(slot.startDate);
    const endDate = DateTime.fromISO(slot.endDate);
    //If the slot does not repeat, simply check if today is between start end and end
    if (slot.repeat === 'NEVER') {
        const interval = Interval.fromDateTimes(startDate, endDate);
        return interval.contains(selectedDate);
    }
    //This logic is still a bit botched since we only check for the start date, not for the end date - possible to update with simple ternary
    if (slot.repeat === 'WEEKLY') {
        return startDate.weekday === selectedDate.weekday;
    }
    if (slot.repeat === 'MONTHLY') {
        return startDate.day === selectedDate.day;
    }
    if (slot.repeat === 'YEARLY') {
        return startDate.day === selectedDate.day && startDate.month === selectedDate.month;
    }
    //If nothing of that applies, the slot must repeat daily and thus be returned
    return true;
}
