import type { DataFunctionArgs } from '@remix-run/node';
import { getQuery } from '~/utils/general-utils';
import { json } from '@remix-run/node';
import { getPublicHolidays } from '~/utils/holidays/public-holidays.server';
import { DateTime } from 'luxon';
import { prisma } from '../../prisma/db';

export const loader = async ({ request }: DataFunctionArgs) => {
    const validFrom = getQuery(request, 'validFrom');
    const validUntil = getQuery(request, 'validUntil');
    if (!validFrom || !validUntil) {
        throw json({ error: 'Please provide a duration for your request' }, { status: 400 });
    }
    const validFromDateTime = DateTime.fromISO(validFrom);
    const validUntilDateTime = DateTime.fromISO(validUntil);
    const holidays = await getPublicHolidays(validFromDateTime, validUntilDateTime);
    const createdHolidays = await Promise.all(
        holidays.map((holiday) => {
            return prisma.holiday
                .create({
                    data: { startDate: holiday.startDate, endDate: holiday.endDate },
                })
                .catch((error) => console.log(error));
        })
    );
    return json({
        message: 'Successfully stored holidays',
        holidays: createdHolidays.filter((el) => el),
    });
};
