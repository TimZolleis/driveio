import type { DataFunctionArgs, V2_MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { checkIfUserSetupComplete, getUser, requireRole } from '~/utils/user/user.server';
import { Form, Outlet, useLoaderData } from '@remix-run/react';
import { PageHeader } from '~/components/ui/PageHeader';
import { HorizontalNav } from '~/components/features/nav/HorizontalNav';
import { SidebarNav } from '~/components/features/SideNavigation';
import { Separator } from '~/components/ui/Seperator';
import {
    DrivingSchoolForm,
    drivingSchoolFormSchema,
} from '~/components/features/driving-school/DrivingSchoolForm';
import { findDrivingSchool } from '~/models/driving-school.server';
import { ROLE } from '.prisma/client';
import { Button } from '~/components/ui/Button';
import { prisma } from '../../prisma/db';
import { handleActionError } from '~/utils/general-utils';

export const meta: V2_MetaFunction = () => {
    return [{ title: 'New Remix App' }, { name: 'description', content: 'Welcome to Remix!' }];
};

export const loader = async ({ request }: DataFunctionArgs) => {
    const user = await requireRole(request, ROLE.INSTRUCTOR);
    const drivingSchool = await findDrivingSchool({ drivingSchoolId: user.drivingSchoolId });

    return json({ user, drivingSchool });
};

export const action = async ({ request }: DataFunctionArgs) => {
    const user = await requireRole(request, ROLE.INSTRUCTOR);
    try {
        const data = drivingSchoolFormSchema.parse(await request.formData());
        await prisma.drivingSchool.update({
            where: { id: user.drivingSchoolId },
            data: { ...data },
        });
        return null;
    } catch (error) {
        console.log(error);
        return handleActionError(error);
    }
};

const Index = () => {
    const { drivingSchool } = useLoaderData<typeof loader>();
    return (
        <div className={'w-full'}>
            <div>
                <h3 className='text-lg font-medium'>Generell</h3>
                <p className='text-sm text-muted-foreground'>
                    Hier werden generelle Fahrschuleinstellungen bearbeitet
                </p>
            </div>
            <Separator className={'my-6'} />
            <Form method={'post'}>
                <DrivingSchoolForm drivingSchool={drivingSchool} />
                <div className={'flex justify-end gap-2 mt-4'}>
                    <Button>Speichern</Button>
                </div>
            </Form>
        </div>
    );
};
export default Index;
