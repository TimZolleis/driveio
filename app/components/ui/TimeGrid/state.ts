import { create } from 'zustand';
import { DateTime, Interval } from 'luxon';

interface startDateTimeStore {
    startDateTime: DateTime;
    increase: () => void;
    decrease: () => void;
}

export const useStartDateTimeStore = create<startDateTimeStore>((setState, getState, store) => ({
    startDateTime: DateTime.now(),

    increase: () => setState((state) => ({ startDateTime: state.startDateTime.plus({ week: 1 }) })),
    decrease: () =>
        setState((state) => ({ startDateTime: state.startDateTime.minus({ week: 1 }) })),
}));
