import type { DataFunctionArgs, V2_MetaFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { requireUser } from '~/utils/user/user.server';
import { useRouteError, useSearchParams } from '@remix-run/react';
import { errors } from '~/messages/errors';
import { prisma } from '../../prisma/db';
import { requireResult } from '~/utils/db/require-result.server';
import { ErrorComponent } from '~/components/ui/ErrorComponent';
import { PageHeader } from '~/components/ui/PageHeader';
import { Label } from '~/components/ui/Label';
import { Calendar } from '~/components/ui/Calendar';
import { useState } from 'react';
import { DateTime } from 'luxon';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '~/components/ui/Select';

export const meta: V2_MetaFunction = () => {
    return [{ title: 'New Remix App' }, { name: 'description', content: 'Welcome to Remix!' }];
};

function getParameters(request: Request) {
    const url = new URL(request.url);
    const date = url.searchParams.get('date');
    const duration = url.searchParams.get('duration');
    const defaultParameters = {
        date: DateTime.now(),
        duration: '45',
    };
    if (!date || !duration) {
        url.searchParams.set('duration', defaultParameters.duration);
        url.searchParams.set('date', defaultParameters.date.toISO() || new Date().toISOString());
        return {
            requiresRedirect: true,
            date: defaultParameters.date,
            duration: defaultParameters.duration,
            redirect: url.toString(),
        };
    }
    return { requiresRedirect: false, date: DateTime.fromISO(date), duration };
}

export const loader = async ({ request }: DataFunctionArgs) => {
    const user = await requireUser(request);
    if (user.role !== 'STUDENT') {
        throw new Error(errors.user.noPermission);
    }
    const parameters = getParameters(request);
    if (parameters.requiresRedirect) {
        return redirect(parameters.redirect || '/');
    }
    const studentData = await prisma.studentData
        .findUnique({ where: { userId: user.id } })
        .then((result) => requireResult(result, errors.student.noStudentData));

    //TODO: Otherwise calculate the first available slot - and so on
    //Get working start and end time for instructor
    const instructorData = await prisma.instructorData
        .findUnique({ where: { userId: studentData.instructorId || undefined } })
        .then((result) => requireResult(result, errors.instructor.noInstructorData));
    //Get all blocked slots for the instructor
    const blockedSlots = await prisma.blocking.findMany({
        where: { userId: instructorData.userId },
    });
    //Filter out the repeating ones and determine which apply to the selected date
    const repeatingBlockedSlots = blockedSlots
        .filter((slot) => slot.repeat !== 'NEVER')
        .filter((slot) => {
            const date = DateTime.fromISO(slot.startDate);
            const selected = parameters.date;
            if (slot.repeat === 'WEEKLY') {
                return date.weekday === selected.weekday;
            }
            if (slot.repeat === 'MONTHLY') {
                return date.day === selected.day;
            }
            if (slot.repeat === 'YEARLY') {
                return date.day === selected.day && date.month === selected.month;
            }
            return true;
        });

    // Get previous / later lessons and calculate the waiting time
    // Calculate an array of available slots and show to users

    return null;
};

const Index = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const date = searchParams.get('date');
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(
        date ? DateTime.fromISO(date).toJSDate() : new Date()
    );
    const duration = searchParams.get('duration');

    const updateDuration = (duration: string) => {
        searchParams.set('duration', duration);
        setSearchParams(searchParams);
    };

    const updateDate = (date: Date | undefined) => {
        if (!date) return;
        setSelectedDate(date);
        searchParams.set('date', date.toISOString());
        setSearchParams(searchParams);
    };

    return (
        <div className={'w-full'}>
            <div className={'w-full flex gap-5'}>
                <div>
                    <PageHeader>Fahrstunden buchen</PageHeader>
                    <p className={'text-muted-foreground'}>
                        Buche hier Fahrstunden für die kommende Woche
                    </p>
                </div>
                <div>
                    <Label>Fahrtdauer</Label>
                    <Select
                        onValueChange={(duration) => updateDuration(duration)}
                        defaultValue={duration || '90'}>
                        <SelectTrigger className={'w-[180px]'}>
                            <SelectValue placeholder={'Fahrtdauer auswählen'} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Fahrtdauer</SelectLabel>
                                <SelectItem value='45'>45 Minuten</SelectItem>
                                <SelectItem value='90'>90 Minuten</SelectItem>
                                <SelectItem value='135'>135 Minuten</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className={'flex gap-2 p-3'}>
                <Calendar
                    mode='single'
                    selected={selectedDate}
                    onSelect={updateDate}
                    className='rounded-md'
                />
                <div className={'py-2'}>
                    <div className={'flex items-center gap-5'}>
                        <div>
                            <p className={'font-medium'}>Verfügbarkeit</p>
                            <p className={'text-muted-foreground text-sm'}>
                                {' '}
                                {date
                                    ? DateTime.fromISO(date).toLocaleString(DateTime.DATE_HUGE)
                                    : 'Bitte wähle ein Datum aus'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ErrorBoundary = () => {
    const error = useRouteError();
    return <ErrorComponent error={error}></ErrorComponent>;
};
export default Index;
