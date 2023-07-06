import type { ToISOTimeOptions } from 'luxon';
import { DateTime } from 'luxon';
import { raise } from '~/utils/general-utils';

export function parseHourAndMinuteToDateTime(hourMinute: string) {
    return DateTime.fromFormat(hourMinute, 'HH:mm');
}

export function setTimeOnDate(time: string, dateTime: DateTime) {
    const { hour, minute } = parseHourAndMinuteToDateTime(time);
    return dateTime.set({ hour, minute, second: 0, millisecond: 0 });
}

export function getTimeFromISOString(date: string | null, dateToSetTo?: DateTime) {
    if (!date) {
        throw new Error('Error parsing date');
    }
    const { hour, minute, second, millisecond } = DateTime.fromISO(date);
    if (dateToSetTo) {
        return dateToSetTo.set({ hour, minute, second, millisecond });
    }
    return parseHourAndMinuteToDateTime(DateTime.fromISO(date).toFormat('HH:mm'));
}

export function getSafeISOStringFromDateTime(dateTime: DateTime, options?: ToISOTimeOptions) {
    return dateTime.toISO(options) ?? raise('Error parsing DateTime to ISO');
}
