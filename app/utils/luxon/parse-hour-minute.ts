import { DateTime } from 'luxon';

export function parseHourAndMinuteToDateTime(hourMinute: string) {
    return DateTime.fromFormat(hourMinute, 'HH:mm');
}
export function getTimeFromISOString(date: string | null) {
    if (!date) {
        throw new Error('Error parsing date');
    }
    const { hour, minute } = DateTime.fromISO(date);
    return DateTime.now().set({ hour, minute });
}
