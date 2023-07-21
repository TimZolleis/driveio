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
import { LessonStatusBadge } from '~/components/features/lesson/LessonStatus';
import { errors } from '~/messages/errors';
import { Skeleton } from '~/components/features/user/UserFormSkeleton';

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
    const lessonStart = DateTime.fromISO(lesson.start);
    const lessonEnd = DateTime.fromISO(lesson.end);
    const toISOOptions = {
        suppressMilliseconds: true,
        format: 'basic',
        includeOffset: false,
    } as const;
    const eventData = {
        summary: `Fahrstunde mit ${instructor.firstName} ${instructor.lastName}`,
        start: getSafeISOStringFromDateTime(lessonStart, toISOOptions),
        end: getSafeISOStringFromDateTime(lessonEnd, toISOOptions),
        location: pickupLocation.resourceSets[0]?.resources[0]?.address.formattedAddress,
    };

    return (
        <>
            <div className={'space-y-1'}>
                <div className={'rounded-xl border max-w-sm relative p-3'}>
                    {lessonEnd < DateTime.now() && (
                        <div
                            className={
                                'w-full h-full bg-neutral-100/50 absolute rounded-xl top-0 left-0'
                            }></div>
                    )}

                    <div className={'flex justify-between items-center'}>
                        <p className={'text-gray-400 text-sm'}>
                            {lessonStart.toFormat('dd.MM.yyyy')}
                        </p>
                        <LessonStatusBadge status={lesson.status}></LessonStatusBadge>
                    </div>
                    <div
                        className={
                            'flex justify-between items-center font-bold text-primary text-2xl gap-2 '
                        }>
                        <p>{lessonStart.toFormat('HH:mm')}</p>
                        <div className={'flex w-full justify-between items-center'}>
                            <Dot />
                            <div className={'w-full h-[1px] bg-border'}></div>
                            <Dot />
                        </div>
                        <p>{lessonEnd.toFormat('HH:mm')}</p>
                    </div>
                    {lessonEnd > DateTime.now() && (
                        <>
                            <div className={'py-2 flex justify-between'}>
                                <AddToCalendar codeValue={generateIcalString(eventData)} />
                                <Link
                                    to={`cancel/${lesson.id}`}
                                    className={buttonVariants({
                                        size: 'sm',
                                        variant: 'secondary',
                                    })}>
                                    Absagen
                                </Link>
                            </div>
                        </>
                    )}
                </div>
                {lessonEnd < DateTime.now() && (
                    <p className={'text-xs text-muted-foreground'}>{errors.lesson.expired}</p>
                )}
            </div>
        </>
    );
};

export const LessonCardSkeleton = () => {
    const cards = Array(4).fill(0);
    return (
        <>
            {cards.map((_, i) => (
                <Skeleton key={i} height={80} />
            ))}
        </>
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
