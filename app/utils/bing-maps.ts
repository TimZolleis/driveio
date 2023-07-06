import axios from 'axios';
import { env } from '~/utils/env/env';
import type { BingMapsResponse } from '~/types/bing-maps-response';
import type { BingMapsLocation } from '~/types/bing-maps-location';

const baseURL = 'https://dev.virtualearth.net/REST/v1';

function getBingMapsClient() {
    return axios.create({ baseURL, params: { key: env.BING_MAPS_KEY } });
}

export async function getLocationByName(
    addressLine: string,
    postalCode: string | undefined,
    cityName: string | undefined
) {
    return getBingMapsClient().get<BingMapsResponse<BingMapsLocation>>('/locations', {
        params: {
            countryRegion: 'DE',
            addressLine: addressLine,
            postalCode,
            locality: cityName,
            maxResults: 20,
        },
    });
}

export async function getLocationByCoordinates(lat: number | null, lng: number | null) {
    return getBingMapsClient().get<BingMapsResponse<BingMapsLocation>>(`/locations/${lat},${lng}`);
}
