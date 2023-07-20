import { CSSLoader } from '~/components/ui/Loader';
import type { DataFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { getDisabledDays } from '~/utils/booking/slot.server';
import { bookingConfig } from '~/config/bookingConfig';
import { getSafeISOStringFromDateTime } from '~/utils/luxon/parse-hour-minute';

export const loader = async ({ request, params }: DataFunctionArgs) => {
    const disabledDays = await getDisabledDays(bookingConfig.start, bookingConfig.end);

    return json({
        disabledDays,
        start: getSafeISOStringFromDateTime(bookingConfig.start),
        end: getSafeISOStringFromDateTime(bookingConfig.end),
    });
};

export const action = async ({ request, params }: DataFunctionArgs) => {
    return null;
};

const LoaderPage = () => {
    return <CSSLoader />;
};

export default LoaderPage;
