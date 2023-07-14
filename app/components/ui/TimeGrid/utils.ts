import type { DateTime } from 'luxon';
import { Interval } from 'luxon';
import type { Appointment } from '~/components/ui/TableTimeGrid';

export const timeGridConfig = {
    startHour: 6,
    endHour: 20,
    accuracy: 4,
};

export function calculateColumns(start: DateTime, end: DateTime) {
    const startWeekDay = start.weekday;
    const endWeekDay = end.weekday;
    const days = end.diff(start, 'days').days;
    return { startColumn: startWeekDay, endColumn: endWeekDay, numberOfDays: days };
}
export function calculateRows(start: DateTime, end: DateTime) {
    const startRowHour = (start.hour - timeGridConfig.startHour) * timeGridConfig.accuracy;
    const startRowMinute = () => {
        const segmentNumber = Math.floor(start.minute / 15) + 1;
        return segmentNumber > 4 ? 1 : segmentNumber;
    };
    const startRow = startRowHour + startRowMinute();
    const rowSpan = Math.round(end.diff(start).as('minute') / (60 / timeGridConfig.accuracy));
    return { startRow, rowSpan };
}

export function isInWeek(interval: Interval, start: DateTime, end: DateTime) {
    const startEndInterval = Interval.fromDateTimes(start, end);
    return interval.overlaps(startEndInterval);
}

export const calculateDayColumn = (days: DateTime[], day: DateTime) => {
    const firstDayInGrid = days[0];
    const diff = Math.round(day.diff(firstDayInGrid).as('day'));
    return diff + 1;
};

export const getDailyAppointments = (appointments: Appointment[], day: DateTime) => {
    return appointments.filter((appointment) => {
        return (
            appointment.start.startOf('day') >= day.startOf('day') &&
            appointment.start.startOf('day') < day.startOf('day').plus({ day: 1 })
        );
    });
};

export const getOverlappingAppointments = (appointments: Appointment[]) => {
    return appointments.filter((firstAppointment) => {
        return appointments.some((secondAppointment) => {
            if (firstAppointment.appointmentId !== secondAppointment.appointmentId) {
                return Interval.fromDateTimes(
                    firstAppointment.start,
                    firstAppointment.end
                ).overlaps(Interval.fromDateTimes(secondAppointment.start, secondAppointment.end));
            }
            return false;
        });
    });
};
