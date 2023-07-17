import type { DataFunctionArgs, V2_MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { requireRole } from '~/utils/user/user.server';
import { Form, Link, Outlet, useFetcher, useLoaderData } from '@remix-run/react';
import { Separator } from '~/components/ui/Seperator';
import { findDrivingSchool } from '~/models/driving-school.server';
import type { LessonType, LicenseClass } from '.prisma/client';
import { ROLE } from '.prisma/client';
import { prisma } from '../../prisma/db';
import { handleActionError } from '~/utils/general-utils';
import { Label } from '~/components/ui/Label';
import { Input } from '~/components/ui/Input';
import { zfd } from 'zod-form-data';
import { Plus, X } from 'lucide-react';
import { buttonVariants } from '~/components/ui/Button';
import { changeHexOpacity, cn } from '~/utils/css';
import { useState } from 'react';

export const meta: V2_MetaFunction = () => {
    return [{ title: 'New Remix App' }, { name: 'description', content: 'Welcome to Remix!' }];
};

//TODO: Maybe better route name
export const loader = async ({ request }: DataFunctionArgs) => {
    const user = await requireRole(request, ROLE.INSTRUCTOR);
    const drivingSchool = await findDrivingSchool({ drivingSchoolId: user.drivingSchoolId });
    const licenseClasses = await prisma.licenseClass.findMany({
        where: { drivingSchoolId: user.drivingSchoolId },
    });
    const lessonTypes = await prisma.lessonType.findMany({
        where: { drivingSchoolId: user.drivingSchoolId },
    });

    return json({ user, drivingSchool, licenseClasses, lessonTypes });
};

const addLicenseClassSchema = zfd.formData({
    licenseClass: zfd.text(),
});

export const action = async ({ request }: DataFunctionArgs) => {
    const user = await requireRole(request, ROLE.INSTRUCTOR);
    const formData = await request.formData();
    try {
        const intent = formData.get('intent')?.toString();
        if (intent === 'deleteLicenseClass') {
            const licenseClassId = formData.get('licenseClassId')?.toString();
            await prisma.licenseClass.delete({ where: { id: licenseClassId } });
        }
        if (intent === 'deleteLessonType') {
            const lessonTypeId = formData.get('lessonTypeId')?.toString();
            await prisma.lessonType.delete({ where: { id: lessonTypeId } });
        }
        if (intent === 'editLessonType') {
            const lessonTypeId = formData.get('lessonTypeId')?.toString();
            await prisma.lessonType.update({
                where: { id: lessonTypeId },
                data: {
                    name: formData.get('name')?.toString(),
                    color: formData.get('color')?.toString(),
                },
            });
        } else {
            const { licenseClass } = addLicenseClassSchema.parse(formData);
            await prisma.licenseClass.upsert({
                where: { name: licenseClass },
                create: { name: licenseClass, drivingSchoolId: user.drivingSchoolId },
                update: { name: licenseClass },
            });
        }
        return null;
    } catch (error) {
        return handleActionError(error);
    }
};

const Index = () => {
    const { drivingSchool, licenseClasses, lessonTypes } = useLoaderData<typeof loader>();
    return (
        <div className={'w-full'}>
            <div>
                <h3 className='text-lg font-medium'>Führerscheinklassen / Fahrttypen</h3>
                <p className='text-sm text-muted-foreground'>
                    Hier werden generelle Fahrschuleinstellungen bearbeitet
                </p>
            </div>
            <Separator className={'my-6'} />
            <Form method={'post'}>
                <div className={'grid gap-2'}>
                    <Label>Führerscheinklasse hinzufügen</Label>
                    <Input name={'licenseClass'}></Input>
                </div>
            </Form>
            <div className={'flex items-center flex-wrap gap-2 mt-2'}>
                {licenseClasses
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((licenseClass) => (
                        <LicenseClassTag key={licenseClass.id} licenseClass={licenseClass} />
                    ))}
            </div>

            <div className={'mt-10'}>
                <div className={'flex item-center justify-between'}>
                    <div>
                        <h4 className={'font-medium text-lg'}>Fahrstundentypen</h4>
                        <p className={'text-muted-foreground text-sm'}>Überland, Autobahn etc.</p>
                    </div>
                    <Link to={'add-type'} className={cn(buttonVariants(), 'space-x-2')}>
                        <Plus /> <p>Hinzufügen</p>
                    </Link>
                </div>
                <Outlet />

                <div className={'mt-4 flex items-center flex-wrap gap-2 '}>
                    {lessonTypes.map((lessonType) => (
                        <LessonTypeTag key={lessonType.id} lessonType={lessonType} />
                    ))}
                </div>
            </div>
        </div>
    );
};

const LicenseClassTag = ({ licenseClass }: { licenseClass: LicenseClass }) => {
    const fetcher = useFetcher();
    return (
        <div
            className={
                'px-3 flex py-1 rounded-md bg-gray-100 text-sm font-medium items-center gap-2'
            }>
            <p>{licenseClass.name}</p>
            <X
                onClick={() =>
                    fetcher.submit(
                        { intent: 'deleteLicenseClass', licenseClassId: licenseClass.id },
                        { method: 'post' }
                    )
                }
                className={'w-4 h-4 hover:cursor-pointer'}></X>
        </div>
    );
};

const LessonTypeTag = ({ lessonType }: { lessonType: LessonType }) => {
    const fetcher = useFetcher();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    return (
        <div
            style={{ background: changeHexOpacity(lessonType.color, 0.2) }}
            className={
                'px-3 flex py-1 rounded-md text-sm font-medium items-center gap-2 hover:cursor-pointer'
            }>
            <Link to={`edit-type/${lessonType.id}`}>{lessonType.name}</Link>
            <X
                onClick={() =>
                    fetcher.submit(
                        { intent: 'deleteLessonType', lessonTypeId: lessonType.id },
                        { method: 'post' }
                    )
                }
                className={'w-4 h-4 hover:cursor-pointer'}></X>
        </div>
    );
};

export default Index;
