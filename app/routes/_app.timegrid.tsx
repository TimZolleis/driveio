import { Appointment, TimeGrid, TimeGridContent } from '~/components/ui/TimeGrid';
import { CardDescription, CardHeader, CardTitle } from '~/components/ui/Card';
import { DateTime } from 'luxon';
import React from 'react';

const TimeGridPage = () => {
    return (
        <TimeGrid>
            <CardHeader className={'p-0'}>
                <CardTitle>Blockierte Zeiten</CardTitle>
                <CardDescription>
                    Trage hier Zeiten ein, an denen du nicht für Fahrstunden zur Verfügung stehst.
                </CardDescription>
            </CardHeader>
            <TimeGridContent>
                <Appointment
                    start={DateTime.now().set({ day: 25, hour: 15, minute: 0 })}
                    end={DateTime.now().set({ day: 25, hour: 18, minute: 41 })}></Appointment>
            </TimeGridContent>
        </TimeGrid>
    );
};

export default TimeGridPage;
