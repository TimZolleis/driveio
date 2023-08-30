import type { ReactNode } from 'react';
import type { DateTime } from 'luxon';

function getDaysInBetween(start: DateTime, end: DateTime) {
    const days = [];
    let current = start;
    while (current <= end) {
        days.push(current);
        current = current.plus({ days: 1 });
    }
    return days;
}

interface TimeGridContainerProps {
    children?: ReactNode;
    start: DateTime;
    end: DateTime;
}

export const TimeGridContainer = ({ start, end }: TimeGridContainerProps) => {
    const days = getDaysInBetween(start, end);
    return (
        <div className={'overflow-auto flex-col flex flex-[1_1_auto] isolate'}>
            <div className={'w-[165%] flex-col flex flex-none'}>
                <TimeGridHeader start={start} end={end} />
                <div className={'flex flex-[1_1_auto]'}>
                    <div className={'flex-none w-14 z-10 left-0 sticky'}></div>
                    <div className={'grid-rows-1 grid-cols-1 flex-[1_1_auto] grid'}>
                        <div
                            className={'grid row-start-1 col-start-1 col-end-2'}
                            style={{ gridTemplateRows: 'repeat(48, minmax(3.5rem, 1fr))' }}>
                            <div
                                className={
                                    'grid grid-cols-7 grid-rows-1 row-start-1 col-start-1 col-end-2'
                                }>
                                {days.map((day, index) => (
                                    <div
                                        className={'row-span-1'}
                                        style={{ gridColumnStart: index + 1 }}></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface TimeGridHeaderProps {
    start: DateTime;
    end: DateTime;
}

const TimeGridHeader = ({ start, end }: TimeGridHeaderProps) => {
    const days = getDaysInBetween(start, end);

    return (
        <div className={'pr-8 ring-gray-200 ring-1'}>
            <div className={'grid grid-cols-7'}>
                <div id={'spacer'} className={'w-14 col-end-1'}></div>
                {days.map((day) => (
                    <div key={day.day} className={'justify-center py-3 items-center flex'}>
                        <span className={'flex items-center gap-1 text-sm'}>
                            <p className={' text-muted-foreground'}>
                                {day.toLocaleString({ weekday: 'short' })}
                            </p>
                            <span className={'font-bold'}>{day.toFormat('dd')}</span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
