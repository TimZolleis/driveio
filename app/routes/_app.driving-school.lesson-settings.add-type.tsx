import type { DataFunctionArgs, V2_MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { requireRole } from '~/utils/user/user.server';
import { Form, Link } from '@remix-run/react';
import { ROLE } from '.prisma/client';
import { prisma } from '../../prisma/db';
import { handleActionError } from '~/utils/general-utils';
import { Label } from '~/components/ui/Label';
import { Input } from '~/components/ui/Input';
import { zfd } from 'zod-form-data';
import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button, buttonVariants } from '~/components/ui/Button';

export const meta: V2_MetaFunction = () => {
    return [{ title: 'New Remix App' }, { name: 'description', content: 'Welcome to Remix!' }];
};

export const loader = async ({ request }: DataFunctionArgs) => {
    const user = await requireRole(request, ROLE.INSTRUCTOR);

    return json({ user });
};

const addLessonTypeSchema = zfd.formData({
    name: zfd.text(),
    color: zfd.text(),
});

export const action = async ({ request }: DataFunctionArgs) => {
    const user = await requireRole(request, ROLE.INSTRUCTOR);
    const formData = await request.formData();
    try {
        const { name, color } = addLessonTypeSchema.parse(formData);
        await prisma.lessonType.create({
            data: {
                name,
                color,
                drivingSchoolId: user.drivingSchoolId,
            },
        });
        return redirect('/driving-school/lesson-types');
    } catch (error) {
        return handleActionError(error);
    }
};

const Index = () => {
    return (
        <Form method={'post'} className={'py-4 flex items-center justify-between'}>
            <div className={'flex items-center gap-4'}>
                <div>
                    <Label>Name</Label>
                    <Input name={'name'}></Input>
                </div>
                <div>
                    <Label>Farbe</Label>
                    <HexColorPicker />
                </div>
            </div>
            <div className={'flex items-center gap-2'}>
                <Link to={'..'} className={buttonVariants({ variant: 'secondary' })}>
                    Abbruch
                </Link>
                <Button>Speichern</Button>
            </div>
        </Form>
    );
};

function getRandomHexColor() {
    // Generate random RGB values
    const red = Math.floor(Math.random() * 256);
    const green = Math.floor(Math.random() * 256);
    const blue = Math.floor(Math.random() * 256);

    // Convert RGB to hex color
    return '#' + ((1 << 24) | (red << 16) | (green << 8) | blue).toString(16).slice(1);
}

export const HexColorPicker = ({ defaultValue }: { defaultValue?: string }) => {
    const [randomColor, setRandomColor] = useState(defaultValue || getRandomHexColor());
    return (
        <div className={'flex items-center gap-2'}>
            <Input
                name={'color'}
                onChange={(event) => setRandomColor(event.target.value)}
                value={randomColor}></Input>
            <div
                onClick={() => setRandomColor(getRandomHexColor())}
                className={'rounded-md h-10 w-10 border flex items-center justify-center'}
                style={{ background: randomColor }}>
                <RotateCcw className={'opacity-75 text-white'} />
            </div>
        </div>
    );
};

export default Index;
