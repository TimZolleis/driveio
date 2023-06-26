import {
    TimeGrid,
    TimeGridContent,
    TimeGridDescription,
    TimeGridHeader,
    TimeGridTitle,
} from '~/components/ui/TimeGrid';

const TimeGridPage = () => {
    return (
        <TimeGrid>
            <TimeGridHeader>
                <TimeGridTitle>Blockierte Zeiten</TimeGridTitle>
                <TimeGridDescription>
                    Trage hier Zeiten ein, an denen du nicht für Fahrstunden zur Verfügung stehst.
                </TimeGridDescription>
            </TimeGridHeader>
            <TimeGridContent></TimeGridContent>
        </TimeGrid>
    );
};

export default TimeGridPage;
