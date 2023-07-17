import type { DataFunctionArgs, V2_MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { requireRole } from '~/utils/user/user.server';
import { Form, Link, Outlet, useFetcher, useLoaderData } from '@remix-run/react';
import { Separator } from '~/components/ui/Seperator';
import { findDrivingSchool } from '~/models/driving-school.server';
import type { LessonType, LessonTypeLicenseClass, LicenseClass } from '.prisma/client';
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
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/Card';
import { useDebounceFetcher } from '~/utils/form/debounce-fetcher';

export const meta: V2_MetaFunction = () => {
    return [{ title: 'New Remix App' }, { name: 'description', content: 'Welcome to Remix!' }];
};

export const loader = async ({ request }: DataFunctionArgs) => {
    const user = await requireRole(request, ROLE.INSTRUCTOR);
    const drivingSchool = await findDrivingSchool({ drivingSchoolId: user.drivingSchoolId });
    const licenseClasses = await prisma.licenseClass.findMany({
        where: { drivingSchoolId: user.drivingSchoolId },
    });
    const licenseClassIds = licenseClasses.map((licenseClass) => licenseClass.id);
    const lessonTypes = await prisma.lessonType.findMany({
        where: { drivingSchoolId: user.drivingSchoolId },
    });

    const lessonTypesWithLicenseClasses = await prisma.lessonTypeLicenseClass.findMany({
        where: { licenseClassId: { in: licenseClassIds } },
    });

    return json({
        user,
        drivingSchool,
        licenseClasses,
        lessonTypes,
        lessonTypesWithLicenseClasses,
    });
};

const addClassSettingsSchema = zfd.formData({
    licenseClassId: zfd.text(),
    lessonTypeId: zfd.text(),
    minimumDrives: zfd.text(),
});

export const action = async ({ request }: DataFunctionArgs) => {
    const user = await requireRole(request, ROLE.INSTRUCTOR);
    const formData = await request.formData();
    try {
        const { licenseClassId, lessonTypeId, minimumDrives } =
            addClassSettingsSchema.parse(formData);
        await prisma.lessonTypeLicenseClass.upsert({
            where: {
                licenseClassId_lessonTypeId: {
                    licenseClassId,
                    lessonTypeId,
                },
            },
            create: { licenseClassId, lessonTypeId, minimumDrives: parseInt(minimumDrives) },
            update: { minimumDrives: parseInt(minimumDrives) },
        });

        return null;
    } catch (error) {
        return handleActionError(error);
    }
};

const ClassSettingsPage = () => {
    const { drivingSchool, licenseClasses, lessonTypes, lessonTypesWithLicenseClasses } =
        useLoaderData<typeof loader>();
    const [query, setQuery] = useState('');
    const filteredLicenseClasses = licenseClasses.filter((licenseClass) => {
        return licenseClass.name.toLowerCase().includes(query.toLowerCase());
    });

    return (
        <div className={'w-full'}>
            <div>
                <h3 className='text-lg font-medium'>Führerscheinklassen / Fahrttypen</h3>
                <p className='text-sm text-muted-foreground'>
                    Hier werden generelle Fahrschuleinstellungen bearbeitet
                </p>
            </div>
            <Separator className={'my-6'} />
            <div className={'grid gap-2 py-2'}>
                <Label>Klasse suchen</Label>
                <Input
                    placeholder={'A1'}
                    onChange={(event) => setQuery(event.target.value)}></Input>
            </div>
            <div className={'grid gap-2 xl:grid-cols-2'}>
                {filteredLicenseClasses
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((licenseClass) => (
                        <ClassSettingsCard
                            lessonTypesWithLicenseClasses={lessonTypesWithLicenseClasses}
                            key={licenseClass.id}
                            licenseClass={licenseClass}
                            lessonTypes={lessonTypes}
                        />
                    ))}
            </div>
        </div>
    );
};

const ClassSettingsCard = ({
    licenseClass,
    lessonTypes,
    lessonTypesWithLicenseClasses,
}: {
    licenseClass: LicenseClass;
    lessonTypes: LessonType[];
    lessonTypesWithLicenseClasses: LessonTypeLicenseClass[];
}) => {
    const fetcher = useDebounceFetcher();
    return (
        <Card className={'shadow-none'}>
            <CardHeader className={'pb-0'}>
                <CardTitle className={'text-lg'}>{licenseClass.name}</CardTitle>
            </CardHeader>
            <CardContent className={'pb-2 pt-0'}>
                <div className={'flex items-center gap-2 py-2'}>
                    {lessonTypes.map((lessonType) => (
                        <fetcher.Form method={'POST'} key={lessonType.id}>
                            <input type='hidden' name={'licenseClassId'} value={licenseClass.id} />
                            <input type='hidden' name={'lessonTypeId'} value={lessonType.id} />
                            <div>
                                <Label>{lessonType.name}</Label>
                                <Input
                                    defaultValue={lessonTypesWithLicenseClasses
                                        .find((el) => {
                                            return (
                                                el.licenseClassId === licenseClass.id &&
                                                el.lessonTypeId === lessonType.id
                                            );
                                        })
                                        ?.minimumDrives.toString()}
                                    autosave={true}
                                    fetcher={fetcher}
                                    name={'minimumDrives'}></Input>
                            </div>
                        </fetcher.Form>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default ClassSettingsPage;
