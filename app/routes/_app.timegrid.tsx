import { TimeGridContainer } from '~/components/ui/GridTimeGrid/TimeGrid';
import { DateTime } from 'luxon';

const TimeGridPage = () => {
    return (
        <TimeGridContainer
            start={DateTime.now().startOf('week')}
            end={DateTime.now().endOf('week')}
        />
    );
};

export default TimeGridPage;
