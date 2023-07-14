import { Interval } from 'luxon';
import { raise } from '~/utils/general-utils';

export function useIntervalDays(interval: Interval) {
    return interval
        .splitBy({ day: 1 })
        .map((split) => split.start ?? raise('Error splitting interval'));
}