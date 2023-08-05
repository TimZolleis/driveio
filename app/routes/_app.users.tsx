import type { DataFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { requireUser } from '~/utils/user/user.server';
import { prisma } from '../../prisma/db';
import { Link, Outlet, useLoaderData } from '@remix-run/react';
import { PageHeader } from '~/components/ui/PageHeader';
import { buttonVariants } from '~/components/ui/Button';
import { UserTable } from '~/components/features/user/UserTable';

export const loader = async ({ request, params }: DataFunctionArgs) => {
    const user = await requireUser(request);
    const users = user.admin
        ? await prisma.user.findMany()
        : await prisma.user.findMany({ where: { drivingSchoolId: user.drivingSchoolId } });
    return json({ users });
};

export const action = async ({ request, params }: DataFunctionArgs) => {
    return null;
};

const UserPage = () => {
    const { users } = useLoaderData<typeof loader>();
    return (
        <>
            <div className={'flex w-full justify-between items-center'}>
                <div>
                    <PageHeader>Benutzer</PageHeader>
                    <p className={'text-muted-foreground'}>Übersicht</p>
                </div>
                <Link to={'/users/new'} className={buttonVariants()}>
                    Benutzer hinzufügen
                </Link>
            </div>
            <div className={'mt-5'}>
                <UserTable users={users} />
            </div>
            <Outlet />
        </>
    );
};

export default UserPage;
