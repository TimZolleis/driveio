import type { DataFunctionArgs } from '@remix-run/node';
import { requireUserWithPermission } from '~/utils/user/permissions.server';
import { prisma } from '../../prisma/db';
import { cancelLesson } from '~/models/lesson.server';
import { redirect } from '@remix-run/node';

export const action = async ({ request }: DataFunctionArgs) => {
    const user = await requireUserWithPermission(request, 'lesson.cancel');
    const formData = await request.formData();
    const lessonId = formData.get('lessonId')?.toString();
    if (!lessonId) {
        throw redirect('/');
    }
    const description = formData.get('description')?.toString() ?? null;
    await cancelLesson({ lessonId, userId: user.id, description });
    return redirect('/');
};
