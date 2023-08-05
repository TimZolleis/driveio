import useMeasure from 'react-use-measure';
import type { DateTime } from 'luxon';
import { getDaysInRange } from '~/utils/luxon/interval';
import { useEffect, useState } from 'react';
import type { Variants } from 'framer-motion';
import { AnimatePresence, motion, useSpring } from 'framer-motion';
import { cn } from '~/utils/css';
import { ChevronLeft } from 'lucide-react';

const containerVariants = {
    animate: {
        transition: {
            staggerChildren: 0.1,
        },
    },
};
const childVariants = {
    initial: {
        scale: 0.8,
        opacity: 0,
    },
    animate: {
        scale: 1,
        opacity: 1,
    },
};

export const DaySelector = ({
    availableDays,
    onSelect,
    selected,
}: {
    availableDays: DateTime[];
    onSelect?: (day: DateTime) => void;
    selected: DateTime;
}) => {
    const [ref, { width }] = useMeasure();
    const magicNumber = width / availableDays.length - 10;
    const currentSelectedIndex = availableDays.findIndex(
        (el) => el.toFormat('dd.MM.yyyy') === selected.toFormat('dd.MM.yyyy')
    );
    const [selectedIndex, setSelectedIndex] = useState<number>(currentSelectedIndex || 0);
    const animationValue = useSpring(selectedIndex * -magicNumber);
    const firstAvailableDay = availableDays[0];
    const lastAvailableDay = availableDays[availableDays.length - 1];
    useEffect(() => {
        animationValue.set(selectedIndex * -magicNumber);
    }, [selectedIndex, animationValue]);
    const handleSelectDate = (method: 'add' | 'subtract') => {
        const newIndex =
            method === 'add'
                ? availableDays.length - 1 > selectedIndex
                    ? selectedIndex + 1
                    : selectedIndex
                : selectedIndex > 0
                ? selectedIndex - 1
                : selectedIndex;
        setSelectedIndex(newIndex);
        if (onSelect) {
            onSelect(availableDays[newIndex]);
        }
    };
    const selectedDate = availableDays[selectedIndex];
    return (
        <AnimatePresence>
            <div className={'flex items-center flex-col gap-2'}>
                <motion.p
                    key={selectedIndex}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className={'text-sm font-medium select-none'}>
                    {selectedDate?.toLocaleString({
                        weekday: 'long',
                        day: 'numeric',
                        month: 'numeric',
                    })}
                </motion.p>
                <div className={'w-full flex justify-center gap-3 relative'}>
                    <ChevronButton
                        onClick={() => handleSelectDate('subtract')}
                        disabled={selectedDate && selectedDate <= firstAvailableDay}
                        rotate={false}
                    />
                    <motion.div className={'select-none w-[100px] overflow-hidden relative'}>
                        <motion.div
                            ref={ref}
                            variants={containerVariants}
                            initial={'initial'}
                            animate={'animate'}
                            style={{ x: animationValue }}
                            transition={{ type: 'spring', bounce: 0.5 }}
                            className={'flex items-center gap-2 date-container absolute'}>
                            {availableDays.map((day, index) => (
                                <DaySelectorDay
                                    key={day.day}
                                    day={day}
                                    variants={childVariants}
                                    selectedDay={selectedDate}
                                />
                            ))}
                        </motion.div>
                    </motion.div>
                    <ChevronButton
                        onClick={() => handleSelectDate('add')}
                        disabled={selectedDate && selectedDate >= lastAvailableDay}
                        rotate={true}
                    />
                </div>
            </div>
        </AnimatePresence>
    );
};

const DaySelectorDay = ({
    day,
    variants,
    selectedDay,
}: {
    day: DateTime;
    variants: Variants;
    selectedDay?: DateTime | undefined;
}) => {
    return (
        <motion.div variants={variants} key={day.day} className={'flex flex-col items-center'}>
            <p
                className={cn(
                    'text-xs uppercase leading-none',
                    selectedDay?.hasSame(day, 'day')
                        ? 'text-primary font-medium'
                        : 'text-neutral-400 font-light'
                )}>
                {day.toLocaleString({ month: 'short' })}
            </p>
            <p
                className={cn(
                    'font-semibold text-lg',
                    selectedDay?.hasSame(day, 'day') ? 'text-primary' : 'text-neutral-400'
                )}>
                {day.toFormat('dd')}
            </p>
        </motion.div>
    );
};

const ChevronButton = ({
    onClick,
    disabled,
    rotate,
}: {
    onClick: () => void;
    disabled: boolean;
    rotate: boolean;
}) => {
    return (
        <motion.div
            whileTap={{ scale: 0.9 }}
            onClick={() => onClick()}
            className={cn(
                'p-2 rounded-md border shadow-sm',
                disabled ? 'opacity-50' : 'opacity-100 hover:cursor-pointer'
            )}>
            <ChevronLeft className={cn('w-6 h-6', rotate && 'rotate-180')} />
        </motion.div>
    );
};
