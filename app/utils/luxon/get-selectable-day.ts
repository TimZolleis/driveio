import { DateTime } from 'luxon';

export function getSelectableDay(excluded?: DateTime[]) {
    let nextDay = DateTime.now().startOf('day');
    while (
        nextDay.weekday > 5 ||
        excluded?.some((excludedDay) => excludedDay.startOf('day').equals(nextDay))
    ) {
        nextDay = nextDay.plus({ day: 1 });
    }
    return nextDay;
}
