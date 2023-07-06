import type { DrivingLesson, StudentData, User } from '.prisma/client';
import { DateTime } from 'luxon';
import { Button, buttonVariants } from '~/components/ui/Button';
import { Dot } from '~/components/ui/Dot';
import { getSafeISOStringFromDateTime } from '~/utils/luxon/parse-hour-minute';
import type { BingMapsResponse } from '~/types/bing-maps-response';
import type { BingMapsLocation } from '~/types/bing-maps-location';
import { QRCodeSVG } from 'qrcode.react';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/Popover';
import { useEffect, useState } from 'react';
import { Link } from '@remix-run/react';

interface EventData {
    summary: string;
    start: string;
    end: string;
    description?: string;
    location?: string;
}

function generateIcalString(eventData: EventData) {
    return `BEGIN:VEVENT
SUMMARY:${eventData.summary}
LOCATION:${eventData.location}
DTSTART:${eventData.start}
DTEND:${eventData.end}
END:VEVENT`;
}

export const BookedLessonCard = ({
    lesson,
    instructor,
    studentData,
    pickupLocation,
}: {
    lesson: DrivingLesson;
    instructor: User;
    studentData: StudentData;
    pickupLocation: BingMapsResponse<BingMapsLocation>;
}) => {
    const toISOOptions = {
        suppressMilliseconds: true,
        format: 'basic',
        includeOffset: false,
    } as const;
    const eventData = {
        summary: `Fahrstunde mit ${instructor.firstName} ${instructor.lastName}`,
        start: getSafeISOStringFromDateTime(DateTime.fromISO(lesson.start), toISOOptions),
        end: getSafeISOStringFromDateTime(DateTime.fromISO(lesson.end), toISOOptions),
        location: pickupLocation.resourceSets[0]?.resources[0]?.address.formattedAddress,
    };

    return (
        <div className={'p-3 rounded-xl border max-w-sm'}>
            <p className={'text-gray-400 text-sm'}>
                {DateTime.fromISO(lesson.start).toFormat('DD')}
            </p>
            <div
                className={
                    'flex justify-between items-center font-bold text-primary text-2xl gap-2 '
                }>
                <p>{DateTime.fromISO(lesson.start).toFormat('HH:mm')}</p>
                <div className={'flex w-full justify-between items-center'}>
                    <Dot />
                    <div className={'w-full h-[1px] bg-border'}></div>
                    <Dot />
                </div>
                <p>{DateTime.fromISO(lesson.end).toFormat('HH:mm')}</p>
            </div>
            <div className={'py-2 flex justify-between'}>
                <AddToCalendar codeValue={generateIcalString(eventData)} />
                <Link
                    to={`cancel/${lesson.id}`}
                    className={buttonVariants({ size: 'sm', variant: 'secondary' })}>
                    Absagen
                </Link>
            </div>
        </div>
    );
};

const AddToCalendar = ({ codeValue }: { codeValue: string }) => {
    const [isOnMobile, setIsOnMobile] = useState(false);
    useEffect(() => {
        const userAgent = window.navigator.userAgent.toLowerCase();
        setIsOnMobile(/android|webos|iphone|ipad|ipod|blackberry|windows phone/i.test(userAgent));
    }, []);

    if (isOnMobile) {
        const encodedEvent = encodeURIComponent(codeValue);
        const dataUrl = `data:text/calendar;charset=utf-8,${encodedEvent}`;
        return (
            <a
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
                href={dataUrl}
                download={'event.ics'}>
                Zum Kalender hinzufügen
            </a>
        );
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant={'outline'} size={'sm'}>
                    Zum Kalender hinzufügen
                </Button>
            </PopoverTrigger>
            <PopoverContent className={'flex justify-center'}>
                <QRCodeSVG value={codeValue} />
            </PopoverContent>
        </Popover>
    );
};
