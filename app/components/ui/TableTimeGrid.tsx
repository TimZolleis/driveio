import React from 'react';
import { cn } from '~/utils/css';
import type { Interval } from 'luxon';
import { DateTime } from 'luxon';
import type { RectReadOnly } from 'react-use-measure';
import useMeasure from 'react-use-measure';
import { useIntervalDays } from '~/utils/luxon/interval';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import { getHourRange } from '~/utils/hooks/timegrid';
import { getSafeISOStringFromDateTime } from '~/utils/luxon/parse-hour-minute';
import {
    calculateDayColumn,
    getDailyAppointments,
    getOverlappingAppointments,
    isInWeek,
} from '~/components/ui/TimeGrid/utils';
import { getOverlappingAppointmentGroups } from '~/utils/timegrid/appointment-utils';
import { raise } from '~/utils/general-utils';
import type { REPEAT } from '.prisma/client';
import { motion } from 'framer-motion';

export interface Appointment {
    appointmentId: string;
    start: DateTime;
    end: DateTime;
    name?: string;
    variant?: VariantProps<typeof appointmentVariants>['variant'];
    repeat?: REPEAT;
}

const TimeGridTable = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
    ({ className, ...props }, ref) => (
        <div className={'relative '}>
            <table
                ref={ref}
                className={cn('w-full table-fixed rounded-md border-collapse', className)}
                {...props}
            />
        </div>
    )
);

TimeGridTable.displayName = 'TimeGridTable';

interface TimeGridTableHeadProps extends React.HTMLAttributes<HTMLTableSectionElement> {
    interval: Interval;
    hideDays?: boolean;
}

const TimeGridDayHeader = React.forwardRef<HTMLDivElement, TimeGridTableHeadProps>(
    ({ className, interval, ...props }, ref) => {
        return interval.splitBy({ day: 1 }).map((day) => (
            <th key={day.start?.weekday} className={'px-4 py-2 font-medium font-inter text-left'}>
                <p>{day.start?.toLocaleString({ weekday: 'short' })}</p>
                <p className={'text-sm text-muted-foreground font-normal'}>
                    {day?.start?.toLocaleString(DateTime.DATE_FULL)}
                </p>
            </th>
        ));
    }
);
TimeGridDayHeader.displayName = 'TimeGridDayHeader';

const TimeGridTableHead = React.forwardRef<HTMLTableSectionElement, TimeGridTableHeadProps>(
    ({ className, interval, hideDays, ...props }, ref) => (
        <thead ref={ref}>
            <tr>
                <th className={'w-[60px]'}></th>
                {hideDays ? null : <TimeGridDayHeader interval={interval} />}
            </tr>
        </thead>
    )
);
TimeGridTableHead.displayName = 'TimeGridTableHeader';

interface TimeGridTableContentProps extends React.HTMLAttributes<HTMLTableRowElement> {
    interval: Interval;
    appointments: Appointment[];
    startHour?: number;
    endHour?: number;
    onAppointmentClick?: (appointment: Appointment) => void;
    hideCollisions?: boolean;
    hideTime?: boolean;
}

const appointmentContainerVariants = {
    hidden: {
        opacity: 0,
    },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
        },
    },
};

const TimeGridTableContent = React.forwardRef<HTMLTableRowElement, TimeGridTableContentProps>(
    (
        {
            className,
            interval,
            appointments,
            startHour,
            endHour,
            hideCollisions,
            hideTime,
            onAppointmentClick,
            ...props
        },
        ref
    ) => {
        const [tableBodyRef, tableBodyBounds] = useMeasure();
        const [appointmentContainerRef, appointmentContainerBounds] = useMeasure();
        const days = useIntervalDays(interval);
        const hourRange = getHourRange(startHour || 6, endHour || 20);

        return (
            <tbody className={'relative'} ref={tableBodyRef}>
                <tr
                    className={'absolute h-full grid pointer-events-none'}
                    data-role={'appointment-container'}
                    ref={appointmentContainerRef}
                    style={{
                        gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`,
                        width: `${tableBodyBounds.width - 60}px`,
                        marginLeft: '60px',
                    }}
                    {...props}>
                    {days.map((day) => {
                        const dailyAppointments = getDailyAppointments(appointments, day);
                        const overlapping = getOverlappingAppointments(appointments);
                        const overlappingGroups = getOverlappingAppointmentGroups(overlapping);
                        return (
                            <motion.td
                                variants={appointmentContainerVariants}
                                initial={'hidden'}
                                animate={'visible'}
                                key={day.day}
                                className={'relative m-0 p-0'}
                                style={{ gridColumnStart: calculateDayColumn(days, day) }}>
                                {dailyAppointments.map((appointment) => {
                                    /**
                                     * This map is for adding the index and the respective group size to an onedimensional array
                                     */
                                    const mappedOverlappingGroups = overlappingGroups.map(
                                        (group) => {
                                            const appointmentInGroup = group.find(
                                                (element) =>
                                                    element?.appointmentId ===
                                                    appointment.appointmentId
                                            );
                                            return {
                                                group,
                                                appointmentInGroup,
                                                index: appointmentInGroup
                                                    ? group.indexOf(appointmentInGroup)
                                                    : undefined,
                                            };
                                        }
                                    );
                                    /**
                                     * That now checks if our lesson is indeed in the group
                                     */
                                    const elementInGroup = mappedOverlappingGroups.find(
                                        (element) =>
                                            element.appointmentInGroup?.appointmentId ===
                                            appointment?.appointmentId
                                    );
                                    /**
                                     * Now we know how many overlaps we have in that timeslot, and we know what position our element is
                                     */
                                    const overlapCount = elementInGroup?.group.length;
                                    const overlapIndex = elementInGroup?.index;

                                    return (
                                        <TimeGridTableAppointment
                                            onClick={() =>
                                                onAppointmentClick
                                                    ? onAppointmentClick(appointment)
                                                    : void 0
                                            }
                                            appointmentId={appointment.appointmentId}
                                            show={isInWeek(
                                                interval,
                                                appointment.start,
                                                appointment.end,
                                                appointment.repeat
                                            )}
                                            hideTime={appointment.variant === 'disabled'}
                                            hideCollision={hideCollisions}
                                            key={appointment.appointmentId}
                                            tableBodyBounds={tableBodyBounds}
                                            appointmentContainerBounds={appointmentContainerBounds}
                                            hourRange={hourRange}
                                            start={appointment.start}
                                            end={appointment.end}
                                            name={appointment.name}
                                            overlapIndex={overlapIndex}
                                            overlapCount={overlapCount}
                                            variant={appointment.variant}
                                        />
                                    );
                                })}
                            </motion.td>
                        );
                    })}
                </tr>
                {props.children}
            </tbody>
        );
    }
);
TimeGridTableContent.displayName = 'TimeGridTableContent';

interface TimeGridTableAppointmentProps
    extends React.HTMLAttributes<HTMLTableSectionElement>,
        Appointment,
        VariantProps<typeof appointmentVariants> {
    show: boolean;
    tableBodyBounds: RectReadOnly;
    appointmentContainerBounds: RectReadOnly;
    overlapIndex?: number;
    overlapCount?: number;
    hourRange: DateTime[];
    hideCollision?: boolean;
    hideTime?: boolean;
}

const appointmentVariants = cva('absolute border h-full p-1 pointer-events-auto', {
    variants: {
        variant: {
            available:
                'bg-green-600/20 border-green-400 text-green-600 hover:bg-green-500/30 hover:cursor-pointer',
            default: 'border-indigo-300 bg-indigo-500/20 text-indigo-500 hover:bg-indigo-500/30',
            blocked: 'bg-gray-500/20 text-gray-500',
            error: 'bg-red-500/20 border-red-300 text-red-500',
            overlaps: 'bg-red-100 text-rose-500 border border-rose-300',
            disabled: 'disabled-background',
        },
    },
    defaultVariants: {
        variant: 'default',
    },
});

const appointmentAnimationVariants = {
    hidden: {
        opacity: 0,
    },
    visible: {
        opacity: 1,
        scale: 1,
    },
};

const TimeGridTableAppointment = React.forwardRef<
    HTMLTableSectionElement,
    TimeGridTableAppointmentProps
>(
    (
        {
            className,
            start,
            end,
            name,
            tableBodyBounds,
            hourRange,
            variant,
            appointmentContainerBounds,
            overlapCount,
            overlapIndex,
            show,
            hideTime,
            hideCollision,
            ...props
        },
        ref
    ) => {
        const calculateHourHeight = () => {
            return appointmentContainerBounds.height / hourRange.length;
        };
        const calculateMinuteHeight = () => {
            return calculateHourHeight() / 60;
        };
        const calculateAppointmentHeight = () => {
            const duration = end.diff(start).as('minute');
            return calculateMinuteHeight() * duration;
        };
        const calculateAppointmentOffset = () => {
            const startOfGrid = hourRange[0].set({ day: start.day, month: start.month });
            const diffFromStartOfGrid = start.diff(startOfGrid).as('minute');
            return calculateMinuteHeight() * diffFromStartOfGrid;
        };
        if (!show) {
            return null;
        }

        return (
            <motion.div
                variants={appointmentAnimationVariants}
                style={{
                    width: overlapCount ? `${100 / overlapCount}%` : '100%',
                    y: `${calculateAppointmentOffset()}px`,
                    x: `${overlapIndex ? overlapIndex * 100 : 0}%`,
                    height: calculateAppointmentHeight(),
                }}
                className={appointmentVariants({
                    variant: overlapCount ? (hideCollision ? variant : 'overlaps') : variant,
                })}
                onClick={props.onClick}>
                <p className={'font-semibold text-xs'}>{name || 'Termin'}</p>
                {hideTime ? null : (
                    <p className={'text-xs font-normal'}>
                        {start.toLocaleString(DateTime.TIME_SIMPLE)} -{' '}
                        {end.toLocaleString(DateTime.TIME_SIMPLE)}
                    </p>
                )}
            </motion.div>
        );
    }
);
TimeGridTableAppointment.displayName = 'TimeGridTableAppointment';

interface TimeGridTableAppointmentSelectorProps extends React.HTMLAttributes<HTMLTableRowElement> {
    interval: Interval;
    hours: DateTime[];
    onAppointmentSelection?: (day: string, time: string) => void;
}

const TimeGridTableAppointmentSelector = React.forwardRef<
    HTMLTableRowElement,
    TimeGridTableAppointmentSelectorProps
>(({ className, interval, hours, onAppointmentSelection, ...props }, ref) => {
    const applyBorders = interval.splitBy({ day: 1 }).length > 1;

    return hours.map((date) => (
        <tr key={date.hour} className={cn('z-10', className)} ref={ref} {...props}>
            <td
                className={
                    'font-normal text-muted-foreground text-sm flex items-start -translate-y-3'
                }>
                {date.toLocaleString({ hour: '2-digit' })}
            </td>
            {interval.splitBy({ day: 1 }).map((day) => {
                return (
                    <td
                        onClick={() =>
                            onAppointmentSelection &&
                            onAppointmentSelection(
                                getSafeISOStringFromDateTime(
                                    day?.start ?? raise('Error in interval')
                                ),
                                date.toFormat('HH:mm')
                            )
                        }
                        key={day.start?.weekday}
                        className={cn(
                            'h-[40px] hover:bg-gray-200 z-10',
                            applyBorders ? 'border' : 'border-b border-t'
                        )}>
                        <div className={'grid grid-rows-4 w-full h-full'}></div>
                    </td>
                );
            })}
        </tr>
    ));
});

TimeGridTableAppointmentSelector.displayName = 'TimeGridTableAppointmentSelector';

export { TimeGridTable, TimeGridTableHead, TimeGridTableContent, TimeGridTableAppointmentSelector };
