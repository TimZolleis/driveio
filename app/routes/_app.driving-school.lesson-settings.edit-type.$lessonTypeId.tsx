import type { DataFunctionArgs, V2_MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { requireRole } from '~/utils/user/user.server';
import { Form, Link, useLoaderData } from '@remix-run/react';
import { ROLE } from '.prisma/client';
import { prisma } from '../../prisma/db';
import { handleActionError, requireParameter } from '~/utils/general-utils';
import { Label } from '~/components/ui/Label';
import { Input } from '~/components/ui/Input';
import { zfd } from 'zod-form-data';
import { useState } from 'react';
import { RotateCcw, X } from 'lucide-react';
import { Button, buttonVariants } from '~/components/ui/Button';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '~/components/ui/AlertDialog';
import { requireResult } from '~/utils/db/require-result.server';
import { changeHexOpacity } from '~/utils/css';
import { HexColorPicker } from '~/routes/_app.driving-school.lesson-settings.add-type';

export const meta: V2_MetaFunction = () => {
    return [{ title: 'New Remix App' }, { name: 'description', content: 'Welcome to Remix!' }];
};

export const loader = async ({ request, params }: DataFunctionArgs) => {
    const user = await requireRole(request, ROLE.INSTRUCTOR);
    const lessonTypeId = requireParameter('lessonTypeId', params);
    const lessonType = await prisma.lessonType
        .findUnique({ where: { id: lessonTypeId } })
        .then((result) => requireResult(result));

    return json({ lessonType });
};

const editLessonTypeSchema = zfd.formData({
    name: zfd.text(),
    color: zfd.text(),
});

export const action = async ({ request }: DataFunctionArgs) => {
    const user = await requireRole(request, ROLE.INSTRUCTOR);
    const formData = await request.formData();
    try {
        const { name, color } = editLessonTypeSchema.parse(formData);
        const lessonTypeId = formData.get('lessonTypeId')?.toString();
        await prisma.lessonType.update({
            where: {
                id: lessonTypeId,
            },
            data: {
                name,
                color,
            },
        });
        return redirect('/driving-school/lesson-settings');
    } catch (error) {
        return handleActionError(error);
    }
};

const EditLessonType = () => {
    const { lessonType } = useLoaderData<typeof loader>();
    return (
        <AlertDialog open={true}>
            <AlertDialogContent>
                <Form method={'post'}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{lessonType.name}</AlertDialogTitle>
                        <input type='hidden' value={lessonType.id} name={'lessonTypeId'} />
                        <div className={'flex items-center gap-2'}>
                            <div className={'grid gap-2'}>
                                <Label>Name</Label>
                                <Input defaultValue={lessonType.name} name={'name'} />
                            </div>
                            <div className={'grid gap-2'}>
                                <Label>Farbe</Label>
                                <HexColorPicker defaultValue={lessonType.color} />
                            </div>
                        </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter className={'mt-2'}>
                        <Link to={'..'} className={buttonVariants({ variant: 'secondary' })}>
                            Abbrechen
                        </Link>
                        <Button name={'intent'} value={'editLessonType'}>
                            Speichern
                        </Button>
                    </AlertDialogFooter>
                </Form>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default EditLessonType;
