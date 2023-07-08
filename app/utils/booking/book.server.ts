import { getQuery } from '~/utils/general-utils';
import { getSelectableDay } from '~/utils/luxon/get-selectable-day';
import { getDisabledDays, isValidDate } from '~/utils/booking/slot.server';
import { bookingConfig } from '~/config/bookingConfig';
import { DateTime } from 'luxon';
import { getSafeISOStringFromDateTime } from '~/utils/luxon/parse-hour-minute';

export async function verifyParameters(request: Request, disabled?: string[]) {
    const date = getQuery(request, 'date');
    const duration = getQuery(request, 'duration');
    const disabledDays = await getDisabledDays(bookingConfig.start, bookingConfig.end).then(
        (result) => result.map((day) => DateTime.fromISO(day))
    );

    if (!date || !duration || !isValidDate(DateTime.fromISO(date), disabledDays)) {
        const url = new URL(request.url);
        const selectableDay = getSelectableDay(disabledDays);
        url.searchParams.set('duration', bookingConfig.defaultDuration);
        url.searchParams.set('date', getSafeISOStringFromDateTime(selectableDay));
        return {
            verified: false,
            requiresRedirect: true,
            duration: bookingConfig.defaultDuration,
            date: selectableDay,
            redirectUrl: url.toString(),
        };
    }
    return { verified: true, requiresRedirect: false, duration, date: DateTime.fromISO(date) };
}
