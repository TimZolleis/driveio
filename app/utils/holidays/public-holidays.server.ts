import { DateTime } from 'luxon';
import axios from 'axios';
import { raise } from '~/utils/general-utils';
import type { HolidayApiResponse } from '~/types/holiday-api-holidays';
import { prisma } from '../../../prisma/db';
import { getSafeISOStringFromDateTime } from '~/utils/luxon/parse-hour-minute';
import type { Holiday } from '.prisma/client';

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

export async function getStoredHolidays(start: DateTime, end: DateTime) {
    return prisma.holiday.findMany({
        where: {
            startDate: {
                gte: getSafeISOStringFromDateTime(start),
                lte: getSafeISOStringFromDateTime(end),
            },
        },
    });
}

export function parsePublicHolidays(holidays: HolidayApiResponse | Holiday[]) {
    return holidays.map((holiday) => {
        return DateTime.fromISO(holiday.startDate);
    });
}
