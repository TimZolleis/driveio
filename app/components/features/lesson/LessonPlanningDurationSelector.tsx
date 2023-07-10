import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '~/components/ui/Select';
import { DateTime, Interval } from 'luxon';
import { useSearchParams } from '@remix-run/react';

export const LessonPlanningDurationSelector = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const possibleStarts = [
        DateTime.now().startOf('week'),
        DateTime.now().startOf('week').plus({ week: 1 }),
    ];
    const possibleIntervals = possibleStarts.map((start) => {
        const end = start.plus({ day: 4 });
        return Interval.fromDateTimes(start, end);
    });

    return (
        <Select
            onValueChange={(value) => {
                searchParams.set('start', value);
                setSearchParams(searchParams);
            }}
            defaultValue={possibleStarts[0].toISO() ?? 'dateParsingError'}>
            <SelectTrigger className='w-[300px]'>
                <SelectValue placeholder='Select a fruit' />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    {possibleIntervals.map((interval) => (
                        <SelectItem
                            key={interval.toISO()}
                            value={interval.start?.toISO() ?? 'dateParsingError'}>
                            {interval.start?.toFormat('DD')} - {interval.end?.toFormat('DD')}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    );
};
