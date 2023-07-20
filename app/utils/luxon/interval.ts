import type { DateTime, Interval } from 'luxon';
import { raise } from '~/utils/general-utils';

export function useIntervalDays(interval: Interval) {
    return interval
        .splitBy({ day: 1 })
        .map((split) => split.start ?? raise('Error splitting interval'));
}

export function getDaysInRange(start: DateTime, end: DateTime) {
    const days: DateTime[] = [];
    let current = start;
    while (current <= end) {
        days.push(current);
        current = current.plus({ day: 1 });
    }
    return days;
}
