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
    const duration = getQuery(request, 'duration');
    return {
        duration: duration || bookingConfig.defaultDuration,
        date: date ? DateTime.fromISO(date) : nextSelectableDay,
        nextSelectableDay,
    };
}
