import { DateTime, Interval } from 'luxon';

export function useHourRange(startHour: number, endHour: number) {
    const hours = Array.from({ length: endHour - startHour + 1 }, (_, index) => startHour + index);
    const dateTimes = hours.map((hour) => {
        return DateTime.now().set({ hour, minute: 0, second: 0, millisecond: 0 });
    });
    return dateTimes;
}
