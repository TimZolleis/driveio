import { DateTime, Interval } from 'luxon';
import { raise } from '~/utils/general-utils';
import { getPublicHolidays, parsePublicHolidays } from '~/utils/holidays/public-holidays.server';
import { getSafeISOStringFromDateTime } from '~/utils/luxon/parse-hour-minute';

export async function getDisabledDays(start: DateTime, end: DateTime) {
    const holidays = await getPublicHolidays(start, end)
        .then((response) => parsePublicHolidays(response))
        .then((result) => result.map((day) => getSafeISOStringFromDateTime(day)));
    const weekendDays = getWeekendDays(start, end).map((day) => getSafeISOStringFromDateTime(day));
    const unavailableDays = getUnavailableDays(start, end).map((day) =>
        getSafeISOStringFromDateTime(day)
    );
    return [...holidays, ...weekendDays, ...unavailableDays];
}

function getWeekendDays(start: DateTime, end: DateTime) {
    const interval = Interval.fromDateTimes(start, end);
    return interval
        .splitBy({ day: 1 })
        .filter((split) => {
            const day = split.start ?? raise('Error splitting interval');
            return day.weekday > 5;
        })
        .map((split) => {
            return split.start ?? raise('Error splitting interval');
        });
}

export function getUnavailableDays(start: DateTime, end: DateTime) {
    const availableInterval = Interval.fromDateTimes(start, end);
    const totalAvailableDays = Interval.fromDateTimes(
        DateTime.now().startOf('month'),
        DateTime.now().endOf('month')
    );
    return totalAvailableDays
        .splitBy({ day: 1 })
        .filter((day) => {
            return !availableInterval.overlaps(day);
        })
        .map((split) => split.start ?? raise('Error splitting interval'));
}

export function isValidDate(date: DateTime, disabled?: DateTime[]) {
    const isWeekDay = date.weekday < 6;
    if (!disabled || !isWeekDay) {
        return isWeekDay;
    }
    const found = disabled.some((disabled) => {
        return disabled.startOf('day').equals(date.startOf('day'));
    });
    return !found;
}
