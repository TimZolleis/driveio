import { DateTime } from 'luxon';

export function getSelectableDay(excluded?: DateTime[]) {
    let nextDay = DateTime.now().plus({ day: 1 }).startOf('day');
    while (
        nextDay.weekday > 5 ||
        excluded?.some((excludedDay) => excludedDay.startOf('day').equals(nextDay))
    ) {
        nextDay = nextDay.plus({ day: 1 });
    }
    return nextDay;
}
