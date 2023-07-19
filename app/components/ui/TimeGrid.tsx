import type { HTMLAttributes, ReactNode } from 'react';
import React, { useRef, useState } from 'react';
import { cn } from '~/utils/css';
import { DateTime, Interval } from 'luxon';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getHourRange } from '~/utils/hooks/timegrid';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import useMeasure from 'react-use-measure';
import {
    calculateColumns,
    calculateRows,
    isInWeek,
    timeGridConfig,
} from '~/components/ui/TimeGrid/utils';
import { useStartDateTimeStore } from '~/components/ui/TimeGrid/state';
import Login_ from '~/routes/login_';
import login_ from '~/routes/login_';

const TimeGrid = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn('rounded-lg border bg-card relative p-6', className)}
            {...props}
        />
    )
);
TimeGrid.displayName = 'TimeGrid';

interface TimeGridContentProps extends React.HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}

const TimeGridContent = React.forwardRef<HTMLDivElement, TimeGridContentProps>(
    ({ className, children, ...props }, ref) => {
        const state = useStartDateTimeStore();
        const currentWeek = Interval.fromDateTimes(
            state.startDateTime.startOf('week'),
            state.startDateTime.endOf('week')
        );
        const onIncrease = () => {
            state.increase();
        };
        const onDecrease = () => {
            state.decrease();
        };
        const [gridRef, { height }] = useMeasure();

        return (
            <div ref={ref} className={cn('relative overflow-hidden', className)} {...props}>
                <div className={'grid grid-cols-7 pl-24 w-full'}>
                    <Days interval={currentWeek} />
                </div>
                <Appointments style={{ height }}>{children}</Appointments>
                <TimeGridGrid ref={gridRef} />
            </div>
        );
    }
);
TimeGridContent.displayName = 'TimeGridContent';

const Days = ({ interval }: { interval: Interval }) => {
    return interval.splitBy({ day: 1 }).map((day) => (
        <div key={day.start?.weekday} className={'flex w-full gap-3 h-full'}>
            <div className={'px-4'}>
                <div className={'font-medium'}>
                    {day.start?.toLocaleString({ weekday: 'short' })}
                </div>
                <p className={'text-sm text-muted-foreground'}>
                    {day?.start?.toLocaleString(DateTime.DATE_FULL)}
                </p>
            </div>
            <div className={'h-full absolute w-[1px] bg-border'}></div>
        </div>
    ));
};

interface DaySwitcherProps extends React.HTMLAttributes<HTMLDivElement> {
    onIncrease: () => void;
    onDecrease: () => void;
}

const DaySwitcher = React.forwardRef<HTMLDivElement, DaySwitcherProps>(
    ({ className, onIncrease, onDecrease, ...props }, ref) => (
        <div className={cn(className, 'flex items-center gap-2 stroke-muted-foreground')}>
            <button
                onClick={() => onDecrease()}
                className={'p-2 rounded-lg border hover:cursor-pointer hover:bg-gray-100'}>
                <ChevronLeft size={18}></ChevronLeft>
            </button>
            <button
                onClick={() => onIncrease()}
                className={'p-2 rounded-lg border hover:cursor-pointer hover:bg-gray-100'}>
                <ChevronRight size={18}></ChevronRight>
            </button>
        </div>
    )
);

DaySwitcher.displayName = 'DaySwitcher';

interface TimeGridGridProps extends React.HTMLAttributes<HTMLDivElement> {
    startingHour?: number;
    endingHour?: number;
}

const TimeGridGrid = React.forwardRef<HTMLDivElement, TimeGridGridProps>(
    ({ className, startingHour, endingHour, ...props }, ref) => {
        const range = getHourRange(
            startingHour || timeGridConfig.startHour,
            endingHour || timeGridConfig.endHour
        );
        return (
            <div className={'w-full'}>
                <div className={'grid w-full gap-5 pb-5'} ref={ref}>
                    {range.map((date) => (
                        <div key={date.hour} className={'w-full gap-2 flex items-center'}>
                            <p
                                className={' max-w-max w-full text-sm text-muted-foreground'}
                                key={date.hour}>
                                {date.toLocaleString({ hour: '2-digit' })}
                            </p>
                            <div className={'bg-border h-[1px] w-full'}></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
);

TimeGridGrid.displayName = 'TimeGridGrid';

interface TimeGridItemsProps extends React.HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}

const Appointments = React.forwardRef<HTMLDivElement, TimeGridItemsProps>(
    ({ className, children, ...props }, ref) => {
        const hours = getHourRange(timeGridConfig.startHour, timeGridConfig.endHour);
        const rows = hours.length;
        return (
            <div
                style={{
                    ...props.style,
                    gridTemplateRows: `repeat(${rows * timeGridConfig.accuracy}, minmax(0, 1fr))`,
                }}
                className={'grid grid-cols-7 w-full absolute pl-24 mt-2.5'}>
                {children}
            </div>
        );
    }
);
Appointments.displayName = 'TimeGridItems';

const appointmentVariants = cva('h-full w-full p-1', {
    variants: {
        variant: {
            default: 'border border-indigo-300 bg-indigo-500/20 text-indigo-500',
            blocked: 'bg-red-500/10 text-red-500',
            booked: 'bg-green-500/10 text-green-500',
            overlaps: 'bg-red-100 text-rose-500 border border-rose-300',
        },
    },
    defaultVariants: {
        variant: 'default',
    },
});

interface AppointmentProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof appointmentVariants> {
    start: DateTime;
    end: DateTime;
    overlapCount?: number;
    overlapIndex?: number;
    name?: string;
}

//TODO: Support multiple-day appointments
const Appointment = React.forwardRef<HTMLDivElement, AppointmentProps>(
    ({ className, start, end, variant, overlapCount, overlapIndex, name, ...props }, ref) => {
        const { startRow, rowSpan } = calculateRows(start, end);
        const { startColumn, endColumn, numberOfDays } = calculateColumns(start, end);
        const weekStart = useStartDateTimeStore((state) => state.startDateTime);
        const currentWeek = Interval.fromDateTimes(
            weekStart.startOf('week'),
            weekStart.endOf('week')
        );
        if (!isInWeek(currentWeek, start, end)) {
            return null;
        }
        return (
            <div
                className={cn(
                    appointmentVariants({
                        variant: overlapCount ? 'overlaps' : variant,
                    })
                )}
                style={{
                    gridColumnStart: startColumn,
                    gridRow: `span ${rowSpan} / span ${rowSpan}`,
                    gridRowStart: startRow,
                    width: overlapCount ? `${100 / overlapCount}%` : '100%',
                    transform: `translateX(${overlapIndex ? overlapIndex * 100 : 0}%)`,
                }}>
                <p className={'text-xs font-semibold'}>{name || 'Termin'}</p>
                <p className={'text-xs'}>
                    {start.toLocaleString(DateTime.TIME_SIMPLE)} -{' '}
                    {end.toLocaleString(DateTime.TIME_SIMPLE)}
                </p>
            </div>
        );
    }
);
Appointment.displayName = 'TimeGridItem';

export { TimeGrid, TimeGridContent, Appointment };
