import type { DataFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { getLocationByName } from '~/utils/bing-maps';
import { requireUser } from '~/utils/user/user.server';
import type { BingMapsLocation } from '~/types/bing-maps-location';

function parseQuery(queryString: string) {
    const parts = queryString.split(',').map((part) => part.trim());
    const addressLine = parts[0];
    const postalCode = parts[1];
    const cityName = parts[2];
    return { addressLine, postalCode, cityName };
}

export type LocationApiRoute = {
    message: string;
    results: BingMapsLocation[];
};

export const loader = async ({ request }: DataFunctionArgs) => {
    const user = await requireUser(request);
    const url = new URL(request.url);
    const query = url.searchParams.get('query');
    if (!query) {
        return json({ results: [] });
    }
    const { addressLine, postalCode, cityName } = parseQuery(query);
    const results = await getLocationByName(addressLine, postalCode, cityName);
    return json({ message: 'success', results: results.data.resourceSets[0].resources });
};
