import type { DataFunctionArgs } from '@remix-run/node';
import { getTheoreticalLessons } from '~/models/theoretical-lesson.server';
import { json } from '@remix-run/node';

export const loader = async ({ request }: DataFunctionArgs) => {
    const theoreticalLessons = await getTheoreticalLessons();
    return json({ theoreticalLessons });
};

//In order for this to be nice, the timegrid has to be reworked

const PlanTheoreticalLessonsPage = () => {};
