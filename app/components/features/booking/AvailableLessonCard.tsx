import { TimeSlot } from '~/utils/booking/calculate-available-slots';
import { DateTime } from 'luxon';

export const AvailableLessonCard = ({ slot }: { slot: TimeSlot }) => {
    return (
        <div className={'rounded-md p-2 border hover:bg-muted hover:cursor-pointer'}>
            <p className={'text-sm '}>
                {DateTime.fromISO(slot.start!).toFormat('HH:mm')} -{' '}
                {DateTime.fromISO(slot.end!).toFormat('HH:mm')}
            </p>
        </div>
    );
};
