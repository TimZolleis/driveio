import type { DataFunctionArgs, V2_MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { checkIfUserSetupComplete, getUser } from '~/utils/user/user.server';
import { Outlet, useFetcher, useLoaderData, useSearchParams } from '@remix-run/react';
import { getDisabledDays } from '~/utils/booking/slot.server';
import { bookingConfig } from '~/config/bookingConfig';
import { DaySelector } from '~/components/features/booking/DaySelector';
import { getSafeISOStringFromDateTime } from '~/utils/luxon/parse-hour-minute';
import { getDaysInRange } from '~/utils/luxon/interval';
import { DateTime } from 'luxon';
import * as React from 'react';
import { verifyParameters } from '~/utils/booking/book.server';
import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/Popover';
import { Hourglass, TimerReset } from 'lucide-react';
import { motion } from 'framer-motion';

export const meta: V2_MetaFunction = () => {
    return [{ title: 'New Remix App' }, { name: 'description', content: 'Welcome to Remix!' }];
};

export const loader = async ({ request }: DataFunctionArgs) => {
    const disabledDays = await getDisabledDays(bookingConfig.start, bookingConfig.end);
    const parameters = await verifyParameters(request);
    return json({ disabledDays, date: getSafeISOStringFromDateTime(parameters.date) });
};

const Index = () => {
    const loaderData = useLoaderData<typeof loader>();
    const date = loaderData.date;
    const [selectedDate, setSelectedDate] = useState<DateTime>(DateTime.fromISO(date));
    const disabledDateTimes = loaderData.disabledDays.map((date) => DateTime.fromISO(date));
    const [searchParams, setSearchParams] = useSearchParams();
    return (
        <>
            <div className={'flex flex-col items-center'}>
                <div className={'flex gap-2 items-end w-full p-3 lg:max-w-sm'}>
                    <DaySelector
                        selected={selectedDate}
                        onSelect={(day) => {
                            searchParams.set('date', getSafeISOStringFromDateTime(day));
                            setSearchParams(searchParams);
                        }}
                        availableDays={getDaysInRange(
                            DateTime.now().plus({ day: 1 }),
                            DateTime.now().endOf('week').plus({ week: 1 })
                        ).filter((day) => {
                            return !disabledDateTimes.some((disabledDateTime) => {
                                return disabledDateTime.hasSame(day, 'day');
                            });
                        })}
                    />
                    <DurationSelector />
                </div>
                <Outlet />
            </div>
        </>
    );
};

const DurationSelector = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const updateDuration = (duration: number) => {
        searchParams.set('duration', duration.toString());
        setSearchParams(searchParams);
    };
    return (
        <Popover>
            <PopoverTrigger asChild>
                <div className={'flex items-center gap-2'}>
                    <motion.div
                        whileTap={{ scale: 0.9 }}
                        className={'p-2 rounded-md border shadow-sm hover:cursor-pointer'}>
                        <div>
                            <TimerReset className={'w-6 h-6'} />
                        </div>
                    </motion.div>
                    <p className={'font-medium text-sm select-none'}>
                        {searchParams.get('duration')} Minuten
                    </p>
                </div>
            </PopoverTrigger>
            <PopoverContent className={'text-sm text-muted-foreground grid grid-cols-2 gap-2'}>
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    className={'rounded-md p-2 border w-full appearance-none'}
                    onClick={() => updateDuration(90)}>
                    90 Minuten
                </motion.button>
                <input type='hidden' name={'duration'} value={'135'} />
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    className={'rounded-md p-2 border w-full appearance-none'}
                    onClick={() => updateDuration(135)}>
                    135 Minuten
                </motion.button>
            </PopoverContent>
        </Popover>
    );
};

export default Index;
