import { getSelectableDay } from '~/utils/luxon/get-selectable-day';

export const bookingConfig = {
    defaultDuration: '90',
    start: getSelectableDay(),
    end: getSelectableDay().startOf('week').plus({ week: 2 }),
};
