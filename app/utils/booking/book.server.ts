import { getQuery, raise } from '~/utils/general-utils';
import { getSelectableDay } from '~/utils/luxon/get-selectable-day';
import { getDisabledDays, isValidDate } from '~/utils/booking/slot.server';
import { bookingConfig } from '~/config/bookingConfig';
import { DateTime } from 'luxon';
import { getSafeISODate, getSafeISOStringFromDateTime } from '~/utils/luxon/parse-hour-minute';
import { redirect } from '@remix-run/node';

export function verifyParameters(request: Request, disabledDays: string[]) {
    const url = new URL(request.url);
    const date = getQuery(request, 'date');
    const disabledDateTimes = disabledDays.map((day) => DateTime.fromISO(day));
    const nextSelectableDay = getSelectableDay(disabledDateTimes);
    if (!date || !isValidDate(DateTime.fromISO(date), disabledDateTimes)) {
        url.searchParams.set('date', getSafeISODate(nextSelectableDay));
        throw redirect(url.toString());
    }
    const duration = getQuery(request, 'duration');
    if (!duration) {
        url.searchParams.set('duration', '90');
        throw redirect(url.toString());
    }
    return {
        duration,
        date: DateTime.fromISO(date),
        nextSelectableDay,
    };
}
