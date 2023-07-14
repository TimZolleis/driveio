import { Tabs, TabsList, TabsTrigger } from '~/components/ui/Tabs';
import { useFetcher, useSearchParams } from '@remix-run/react';

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

function getViewModeValue(viewMode: string | undefined) {
    switch (viewMode) {
        case 'monday':
        case 'tuesday':
        case 'wednesday':
        case 'thursday':
        case 'friday':
            return viewMode;
        default:
            return 'weekly';
    }
}

export const LessonOverviewDaySelector = ({ viewMode }: { viewMode: ViewMode | undefined }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const fetcher = useFetcher();
    return (
        <fetcher.Form>
            <Tabs
                onValueChange={(value) => {
                    fetcher.submit({ viewMode: value }, { method: 'post' });
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
        </fetcher.Form>
    );
};
