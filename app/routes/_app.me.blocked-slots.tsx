import { Link, Outlet, useLoaderData } from '@remix-run/react';
import { Separator } from '~/components/ui/Seperator';
import { buttonVariants } from '~/components/ui/Button';
import { DataFunctionArgs, json } from '@remix-run/node';
import { requireManagementPermissions } from '~/utils/user/user.server';
import { prisma } from '../../prisma/db';
import { Label } from '~/components/ui/Label';
import { BlockingCard } from '~/components/features/blocking/BlockingCard';

export const loader = async ({ request, params }: DataFunctionArgs) => {
    const user = await requireManagementPermissions(request);
    const blockings = await prisma.blocking.findMany({ where: { userId: user.id } });

    return json({ blockings });
};

export const action = async ({ request, params }: DataFunctionArgs) => {
    await requireManagementPermissions(request);
    const blockingId = await request.formData().then((data) => data.get('blocking')?.toString());
    await prisma.blocking.delete({ where: { id: blockingId } });
    return null;
};

const InstructorBlockingsPage = () => {
    const { blockings } = useLoaderData<typeof loader>();
    return (
        <div className={'w-full'}>
            <Outlet />
            <div className={'flex items-center justify-between'}>
                <div>
                    <h3 className='text-lg font-medium'>Blockierungen</h3>
                    <p className='text-sm text-muted-foreground'>
                        Hier können blockierte Zeiten eines Fahrlehrers bearbeitet werden.
                    </p>
                </div>
                <Link to={'add'} className={buttonVariants()}>
                    Blockierung hinzufügen
                </Link>
            </div>
            <Separator className={'my-6'} />
            <div>
                <Label>Wiederkehrend</Label>
                <div className={'grid gap-2'}>
                    {blockings
                        .filter((blocking) => blocking.repeat !== 'NEVER')
                        .map((blocking) => (
                            <BlockingCard key={blocking.id} blocking={blocking} />
                        ))}
                </div>
            </div>
            <div>
                <Label>Einmalig</Label>
                <div className={'grid gap-2'}>
                    {blockings
                        .filter((blocking) => blocking.repeat === 'NEVER')
                        .map((blocking) => (
                            <BlockingCard key={blocking.id} blocking={blocking} />
                        ))}
                </div>
            </div>
        </div>
    );
};

export default InstructorBlockingsPage;
