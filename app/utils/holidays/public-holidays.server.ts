import { DateTime } from 'luxon';
import axios from 'axios';
import { raise } from '~/utils/general-utils';
import type { HolidayApiResponse } from '~/types/holiday-api-holidays';

function getHolidayApiClient() {
    const baseURL = 'https://openholidaysapi.org';
    return axios.create({
        baseURL,
        params: {
            countryIsoCode: 'DE',
            languageIsoCode: 'DE',
            subdivisionCode: 'DE-BY',
        },
    });
}

export async function getPublicHolidays(start: DateTime, end: DateTime) {
    const client = getHolidayApiClient();
    const response = await client.get<HolidayApiResponse>('/PublicHolidays', {
        params: {
            validFrom: start.toISODate() ?? raise('Error parsing to ISO'),
            validTo: end.toISODate() ?? raise('Error parsing to ISO'),
        },
    });
    return response.data;
}

export function parsePublicHolidays(holidays: HolidayApiResponse) {
    return holidays.map((holiday) => {
        return DateTime.fromISO(holiday.startDate);
    });
}
