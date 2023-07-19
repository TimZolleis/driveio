import { getQuery, raise } from '~/utils/general-utils';
import { getSelectableDay } from '~/utils/luxon/get-selectable-day';
import { getDisabledDays, isValidDate } from '~/utils/booking/slot.server';
import { bookingConfig } from '~/config/bookingConfig';
import { DateTime } from 'luxon';
import { getSafeISOStringFromDateTime } from '~/utils/luxon/parse-hour-minute';
import { redirect } from '@remix-run/node';

export async function verifyParameters(request: Request, disabled?: string[]) {
    const url = new URL(request.url);
    const disabledDays = await getDisabledDays(bookingConfig.start, bookingConfig.end).then(
        (result) => result.map((day) => DateTime.fromISO(day))
    );
    const date = getQuery(request, 'date');
    const nextSelectableDay = getSelectableDay(disabledDays);
    if (!date || !isValidDate(DateTime.fromISO(date), disabledDays)) {
        url.searchParams.set('date', getSafeISOStringFromDateTime(nextSelectableDay));
        throw redirect(url.toString());
    }
    const duration = getQuery(request, 'duration');
    if (!duration) {
        url.searchParams.set('duration', '90');
        url.searchParams.set('selectDuration', 'true');
        throw redirect(url.toString());
    }
    return {
        duration,
        date: DateTime.fromISO(date),
        nextSelectableDay,
    };
}
