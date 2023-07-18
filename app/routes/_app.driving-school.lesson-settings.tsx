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
import { MoreVertical, Plus, X } from 'lucide-react';
import { Button, buttonVariants } from '~/components/ui/Button';
import { changeHexOpacity, cn } from '~/utils/css';
import { useEffect, useState } from 'react';
import { Reorder, useMotionValue, motion } from 'framer-motion';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/Popover';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from '~/components/ui/Dropdown';
import { useDebounceFetcher } from '~/utils/form/debounce-fetcher';
import { sendJsonWithSuccessMessage } from '~/utils/flash/toast.server';

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
        orderBy: { index: 'asc' },
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
        switch (intent) {
            case 'deleteLicenseClass': {
                const licenseClassId = formData.get('licenseClassId')?.toString();
                const deleted = await prisma.licenseClass.delete({ where: { id: licenseClassId } });
                return sendJsonWithSuccessMessage(request, {
                    title: 'Führerscheinklasse gelöscht',
                    description: `Führerscheinklasse ${deleted.name} wurde erfolgreich gelöscht`,
                });
            }
            case 'deleteLessonType': {
                const lessonTypeId = formData.get('lessonTypeId')?.toString();
                const deleted = await prisma.lessonType.delete({ where: { id: lessonTypeId } });
                return sendJsonWithSuccessMessage(request, {
                    title: 'Fahrttyp gelöscht',
                    description: `Fahrttyp ${deleted.name} wurde erfolgreich gelöscht`,
                });
            }
            case 'reorderLessonTypes': {
                const lessonTypeIds = formData.get('lessonTypeIds')?.toString().split(',');
                if (lessonTypeIds) {
                    const updated = await Promise.all(
                        lessonTypeIds.map((id, index) => {
                            console.log('Update', id, 'to', index, 'index');
                            return prisma.lessonType.update({ where: { id }, data: { index } });
                        })
                    );
                }
                return sendJsonWithSuccessMessage(request, {
                    title: 'Fahrttypen sortiert',
                    description: 'Die Fahrttypen wurden erfolgreich sortiert',
                });
            }
            default: {
                const { licenseClass } = addLicenseClassSchema.parse(formData);
                await prisma.licenseClass.upsert({
                    where: { name: licenseClass },
                    create: { name: licenseClass, drivingSchoolId: user.drivingSchoolId },
                    update: { name: licenseClass },
                });
                return sendJsonWithSuccessMessage(request, {
                    title: 'Führerscheinklassen aktualisiert',
                    description: 'Die Führerscheinklassen wurden erfolgreich aktualisiert',
                });
            }
        }
    } catch (error) {
        return handleActionError(error);
    }
};

const Index = () => {
    const { drivingSchool, licenseClasses, lessonTypes } = useLoaderData<typeof loader>();
    const fetcher = useDebounceFetcher();
    const [currentLessonTypes, setCurrentLessonTypes] = useState(lessonTypes);
    const [hasChanged, setHasChanged] = useState(false);
    useEffect(() => {
        setCurrentLessonTypes(lessonTypes);
    }, [lessonTypes]);

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
            <motion.div layout className={'flex items-center flex-wrap gap-2 mt-2'}>
                {licenseClasses
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((licenseClass) => (
                        <LicenseClassTag key={licenseClass.id} licenseClass={licenseClass} />
                    ))}
            </motion.div>

            <div className={'mt-10'}>
                <div className={'flex item-center justify-between'}>
                    <div>
                        <h4 className={'font-medium text-lg'}>Fahrstundentypen</h4>
                        <p className={'text-muted-foreground text-sm'}>
                            Die Reihenfolge bestimmt die automatische Fahrstundenzuweisung
                        </p>
                    </div>
                    <Link to={'add-type'} className={cn(buttonVariants(), 'space-x-2')}>
                        <Plus /> <p>Hinzufügen</p>
                    </Link>
                </div>
                <Outlet />

                <div className={'mt-4'}>
                    <Reorder.Group
                        className={'space-y-2'}
                        axis={'y'}
                        onReorder={(array) => {
                            setCurrentLessonTypes(array);
                            fetcher.debounceSubmit(
                                {
                                    intent: 'reorderLessonTypes',
                                    lessonTypeIds: array.map((lessonType) => lessonType.id),
                                },
                                { method: 'post', debounceTimeout: 500 }
                            );
                        }}
                        values={currentLessonTypes}>
                        {currentLessonTypes.map((lessonType, index) => (
                            <LessonTypeCard
                                index={index}
                                key={lessonType.id}
                                lessonType={lessonType}
                            />
                        ))}
                    </Reorder.Group>
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

const LessonTypeCard = ({ lessonType, index }: { lessonType: LessonType; index: number }) => {
    const fetcher = useFetcher();
    const x = useMotionValue(0);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    return (
        <Reorder.Item
            value={lessonType}
            style={{ x }}
            className={'flex items-center justify-between rounded-md bg-white border p-3 w-full'}>
            {/*<Link to={`edit-type/${lessonType.id}`}>{lessonType.name}</Link>*/}
            <div className={'flex items-center gap-2'}>
                <p className={'text-muted-foreground text-sm'}>#{index + 1}</p>
                <p className={'font-medium text-sm'}>{lessonType.name}</p>
                <div
                    className={'w-4 h-4 rounded-full'}
                    style={{ background: lessonType.color }}></div>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <MoreVertical
                        className={'w-6 h-6 text-muted-foreground stroke-1 hover:cursor-pointer'}
                    />
                </DropdownMenuTrigger>
                <DropdownMenuContent className='w-56' align='end' forceMount>
                    <DropdownMenuGroup>
                        <DropdownMenuItem asChild={true}>
                            <Link to={`edit-type/${lessonType.id}`}>Bearbeiten</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() =>
                                fetcher.submit(
                                    { intent: 'deleteLessonType', lessonTypeId: lessonType.id },
                                    { method: 'post', replace: true }
                                )
                            }>
                            Löschen
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </Reorder.Item>
    );
};

export default Index;
