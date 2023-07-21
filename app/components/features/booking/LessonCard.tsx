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
import { Form, Link, useNavigation } from '@remix-run/react';
import { LessonStatusBadge } from '~/components/features/lesson/LessonStatus';
import { errors } from '~/messages/errors';
import { Skeleton } from '~/components/features/user/UserFormSkeleton';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '~/components/ui/AlertDialog';
import { MoreVertical } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '~/components/ui/Dropdown';

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

export const LessonCard = ({
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
                <div className={'rounded-md border relative p-4 shadow relative'}>
                    {lessonEnd < DateTime.now() && (
                        <div
                            className={
                                'w-full h-full bg-neutral-100/50 absolute rounded-xl top-0 left-0'
                            }></div>
                    )}
                    <div className={'p-3 absolute top-0 right-0 rounded-full'}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild={true}>
                                <MoreVertical
                                    className={'w-5 h-5 text-gray-400 hover:cursor-pointer'}
                                />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <AddToCalendar codeValue={generateIcalString(eventData)} />
                                <CancelLesson lesson={lesson} />
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <LessonStatusBadge status={lesson.status}></LessonStatusBadge>
                    <p className={'text-lg font-semibold'}>
                        Fahrstunde mit {instructor.firstName} {instructor.lastName}
                    </p>
                    <div className={'flex items-center gap-2 mt-2'}>
                        <div
                            className={
                                'bg-primary/10 text-primary text-xs rounded-md px-3 py-1 font-medium'
                            }>
                            {lessonStart.toFormat('dd.MM.yyyy')}
                        </div>
                        <div
                            className={
                                'bg-primary/10 text-primary text-xs rounded-md px-3 py-1 font-medium'
                            }>
                            {lessonStart.toFormat('HH:mm')} - {lessonEnd.toFormat('HH:mm')}
                        </div>
                    </div>

                    {/*{lessonEnd > DateTime.now() && (*/}
                    {/*    <>*/}
                    {/*        <div className={'py-2 flex justify-between'}>*/}
                    {/*            <AddToCalendar codeValue={generateIcalString(eventData)} />*/}
                    {/*            <CancelLesson lesson={lesson} />*/}
                    {/*        </div>*/}
                    {/*    </>*/}
                    {/*)}*/}
                </div>
                {lessonEnd < DateTime.now() && (
                    <p className={'text-xs text-muted-foreground'}>{errors.lesson.expired}</p>
                )}
            </div>
        </>
    );
};

const CancelLesson = ({ lesson }: { lesson: DrivingLesson }) => {
    const hasToPayFee = DateTime.fromISO(lesson.start).diff(DateTime.now()).as('hours') < 24;
    const navigation = useNavigation();
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <button
                    className={
                        'w-full hover:bg-secondary flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground'
                    }>
                    Absagen
                </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Fahrstunde absagen</AlertDialogTitle>
                    <AlertDialogDescription>
                        Möchtest du die Fahrstunde am{' '}
                        {DateTime.fromISO(lesson.start).toLocaleString({ weekday: 'long' })}{' '}
                        wirklich absagen?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <Form method={'post'} action={'/cancel-lesson'} className={'w-full'}>
                        <input type='hidden' name={'lessonId'} value={lesson.id} />
                        <Button className={'w-full'} isLoading={navigation.state === 'submitting'}>
                            Bestätigen
                        </Button>
                    </Form>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
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
                <button
                    className={
                        'w-full hover:bg-secondary flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground'
                    }>
                    Zum Kalender hinzufügen
                </button>
            </PopoverTrigger>
            <PopoverContent className={'flex justify-center'}>
                <QRCodeSVG value={codeValue} />
            </PopoverContent>
        </Popover>
    );
};
