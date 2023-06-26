import React, { ReactNode, useEffect, useState } from 'react';
import { cn } from '~/utils/css';
import { DateTime, Interval } from 'luxon';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useHourRange } from '~/utils/hooks/timegrid';
import { Separator } from '~/components/ui/Seperator';
import { cva } from 'class-variance-authority';
import useMeasure from 'react-use-measure';
import { he } from 'date-fns/locale';

const TimeGrid = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn('rounded-lg border bg-card relative', className)} {...props} />
    )
);
TimeGrid.displayName = 'TimeGrid';

const TimeGridHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
    )
);
TimeGridHeader.displayName = 'TimeGridHeader';

const TimeGridTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn('text-lg font-semibold leading-none tracking-tight', className)}
        {...props}
    />
));
TimeGridTitle.displayName = 'TimeGridTitle';

const TimeGridDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));
TimeGridDescription.displayName = 'TimeGridDescription';

const TimeGridContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => {
        const [startingDateTime, setStartingDateTime] = useState(DateTime.now());
        const week = Interval.fromDateTimes(
            startingDateTime.startOf('week'),
            startingDateTime.endOf('week')
        );
        const onIncrease = () => {
            setStartingDateTime(startingDateTime.plus({ week: 1 }));
        };
        const onDecrease = () => {
            setStartingDateTime(startingDateTime.minus({ week: 1 }));
        };
        const [gridRef, { height }] = useMeasure();
        console.log(height);

        return (
            <div ref={ref} className={cn('p-6 relative overflow-hidden', className)} {...props}>
                <DaySwitcher onDecrease={onDecrease} onIncrease={onIncrease} className={'mb-2'} />
                <div className={'grid grid-cols-7 gap-2 pl-24 w-full'}>
                    <TimeGridDays interval={week} />
                </div>
                <TimeGridItems style={{ height: height + 10 }}>
                    <TimeGridItem
                        start={DateTime.now()}
                        end={DateTime.now().plus({ hour: 1 })}></TimeGridItem>
                </TimeGridItems>
                <TimeGridGrid ref={gridRef} />
            </div>
        );
    }
);
TimeGridContent.displayName = 'TimeGridContent';

const TimeGridDays = ({ interval }: { interval: Interval }) => {
    return interval.splitBy({ day: 1 }).map((day) => (
        <div key={day.start?.weekday} className={'flex w-full gap-3 '}>
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
        const range = useHourRange(startingHour || 6, endingHour || 20);
        return (
            <div className={'w-full py-2.5'} ref={ref}>
                <div className={'grid gap-5 w-full mt-5'}>
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

interface TimeGridItemProps extends React.HTMLAttributes<HTMLDivElement> {
    start: DateTime;
    end: DateTime;
}

interface TimeGridItemsProps extends React.HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}

const TimeGridItems = React.forwardRef<HTMLDivElement, TimeGridItemsProps>(
    ({ className, children, ...props }, ref) => {
        const hours = useHourRange(6, 20);
        const rows = hours.length;
        return (
            <div
                style={{
                    ...props.style,
                    gridTemplateRows: `repeat(${(rows + 1) * 4}, minmax(0, 1fr))`,
                    marginLeft: '1px',
                    marginTop: '1px',
                }}
                className={'grid grid-cols-7 gap-x-2 pl-24 w-full absolute'}>
                {children}
            </div>
        );
    }
);

//TODO: Think of better way to place item in time
const TimeGridItem = React.forwardRef<HTMLDivElement, TimeGridItemProps>(
    ({ className, start, end, ...props }, ref) => {
        const timeGridItemVariants = cva('rounded-md h-full w-full py-1 px-2', {
            variants: {
                variant: {
                    default: 'bg-gray-100',
                    blocked: 'bg-red-500/20 text-red-500',
                },
            },
            defaultVariants: {
                variant: 'default',
            },
        });

        const roundedStartTime = Math.round(start.minute / 15);
        const roundedDuration = Math.round(end.diff(start).as('minute') / 15);

        return (
            <div
                className={cn(timeGridItemVariants({ variant: 'blocked' }))}
                style={{ gridRow: `span ${roundedDuration}`, gridRowStart: '1' }}>
                <p className={'text-xs font-semibold'}>Termin</p>
                <p className={'text-xs'}>
                    {start.toLocaleString(DateTime.TIME_SIMPLE)} -{' '}
                    {end.toLocaleString(DateTime.TIME_SIMPLE)}
                </p>
            </div>
        );
    }
);

TimeGridGrid.displayName = 'TimeGridGrid';

export { TimeGrid, TimeGridHeader, TimeGridTitle, TimeGridDescription, TimeGridContent };
