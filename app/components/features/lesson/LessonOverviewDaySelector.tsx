import { Tabs, TabsList, TabsTrigger } from '~/components/ui/Tabs';
import { useSearchParams } from '@remix-run/react';

const viewModes = [
    {
        name: 'Wöchentlich',
        value: 'weekly',
    },
    {
        name: 'Montag',
        value: 'monday',
    },
    {
        name: 'Dienstag',
        value: 'tuesday',
    },
    {
        name: 'Mittwoch',
        value: 'wednesday',
    },
    {
        name: 'Donnerstag',
        value: 'thursday',
    },
    {
        name: 'Freitag',
        value: 'friday',
    },
] as const;
export type ViewMode = (typeof viewModes)[number]['value'];

function getViewModeValue(viewMode: string | null) {
    switch (viewMode) {
        case 'monday': {
            return 'monday';
        }
        case 'tuesday': {
            return 'tuesday';
        }
        case 'wednesday': {
            return 'wednesday';
        }
        case 'thursday': {
            return 'thursday';
        }
        case 'friday': {
            return 'friday';
        }
    }
    return 'weekly';
}

export const LessonOverviewDaySelector = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const viewMode = searchParams.get('view');

    return (
        <Tabs
            onValueChange={(value) => {
                searchParams.set('view', value);
                setSearchParams(searchParams);
            }}
            defaultValue={getViewModeValue(viewMode)}
            className={'mt-4'}>
            <TabsList>
                {viewModes.map((mode) => (
                    <TabsTrigger key={mode.value} value={mode.value}>
                        {mode.name}
                    </TabsTrigger>
                ))}
            </TabsList>
        </Tabs>
    );
};
