import {
    getSafeISOStringFromDateTime,
    getTimeFromISOString,
    parseHourAndMinuteToDateTime,
    setTimeOnDate,
} from '~/utils/luxon/parse-hour-minute';
import { DateTime, Interval } from 'luxon';
import type { BlockedSlot, DrivingLesson } from '.prisma/client';
import uuid4 from 'uuid4';

export interface TimeSlot {
    start: string;
    end: string;
    id: string;
}

type FindAvailableSlotProps = {
    workStart: string;
    workEnd: string;
    slotDuration: number;
    unavailableSlots: TimeSlot[];
    waitingTimeAfterLesson: number;
    selectedDate: DateTime;
};

export function findAvailableSlots({
    workStart,
    workEnd,
    slotDuration,
    unavailableSlots,
    waitingTimeAfterLesson,
    selectedDate,
}: FindAvailableSlotProps) {
    const slots: TimeSlot[] = [];
    const isSameDay = selectedDate.hasSame(DateTime.now(), 'day');

    const startTime = isSameDay ? DateTime.now() : parseHourAndMinuteToDateTime(workStart);
    const endTime = parseHourAndMinuteToDateTime(workEnd);
    let currentSlotStart = startTime;
    while (currentSlotStart <= endTime) {
        /**
         * Here we create a slot with the desired duration
         */
        const currentSlotEnd = currentSlotStart.plus({ minute: slotDuration });
        const timeSlot = {
            start: currentSlotStart.toFormat('HH:mm'),
            end: currentSlotEnd.toFormat('HH:mm'),
            id: uuid4(),
        };
        /**
         * Here we check for the first lesson that overlaps with the created slot
         */
        const overlapsWithUnavailableSlot = unavailableSlots.find((unavailableSlot) => {
            const unavailableSlotStart = getTimeFromISOString(unavailableSlot.start);
            const unavailableSlotEnd = getTimeFromISOString(unavailableSlot.end);
            return checkOverlap(
                { start: currentSlotStart, end: currentSlotEnd },
                { start: unavailableSlotStart, end: unavailableSlotEnd }
            );
        });
        /**
         * Here we check for the first overlapping blocked slot
         */
        /**
         * If we do not have any overlaps, we just assign the slot and move on - the next creation starts on a slot end
         */
        if (!overlapsWithUnavailableSlot) {
            if (timeSlot.end <= workEnd) {
                slots.push(timeSlot);
            }
            currentSlotStart = currentSlotEnd;
        }
        /**
         * If it overlaps with a booked slot, we assign the next start to the end of the lesson plus the waiting time assigned to the student
         */
        if (overlapsWithUnavailableSlot) {
            currentSlotStart = getTimeFromISOString(overlapsWithUnavailableSlot.end).plus({
                minute: waitingTimeAfterLesson,
            });
        }
    }
    return slots.map((slot) => {
        return {
            ...slot,
            start: getSafeISOStringFromDateTime(setTimeOnDate(slot.start, selectedDate)),
            end: getSafeISOStringFromDateTime(setTimeOnDate(slot.end, selectedDate)),
        };
    });
}

interface Slot {
    start: DateTime;
    end: DateTime;
}

export function checkOverlap(slot1: Slot, slot2: Slot) {
    const slot1StartsBeforeSlot2Ends = slot1.start.toFormat('HH:mm') < slot2.end.toFormat('HH:mm');
    const slot1EndsBeforeSlot2Starts = slot1.end.toFormat('HH:mm') > slot2.start.toFormat('HH:mm');
    return slot1StartsBeforeSlot2Ends && slot1EndsBeforeSlot2Starts;
}

export function filterBlockedSlots(slot: BlockedSlot, selectedDate: DateTime) {
    const startDate = DateTime.fromISO(slot.startDate);
    const endDate = DateTime.fromISO(slot.endDate);
    /**
     * If the slot does not repeat, simply check if today is between start and end
     */
    if (slot.repeat === 'NEVER') {
        const interval = Interval.fromDateTimes(startDate, endDate);
        return interval.contains(selectedDate);
    }
    /**
     * This logic is still a bit botched since we only check for the start date, not for the end date - possible to update with simple ternary
     */
    if (slot.repeat === 'WEEKLY') {
        return startDate.weekday === selectedDate.weekday;
    }
    if (slot.repeat === 'MONTHLY') {
        return startDate.day === selectedDate.day;
    }
    if (slot.repeat === 'YEARLY') {
        return startDate.day === selectedDate.day && startDate.month === selectedDate.month;
    }
    /**
     * If nothing of that applies, the slot must repeat daily and thus be returned
     */
    return true;
}
