import { Link, Outlet, useLoaderData } from '@remix-run/react';
import { Separator } from '~/components/ui/Seperator';
import { buttonVariants } from '~/components/ui/Button';
import { DataFunctionArgs, json } from '@remix-run/node';
import { requireManagementPermissions } from '~/utils/user/user.server';
import { prisma } from '../../prisma/db';
import { Label } from '~/components/ui/Label';
import { BlockingCard } from '~/components/features/blocking/BlockingCard';
import { Card, CardDescription, CardHeader, CardTitle } from '~/components/ui/Card';

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
            <div className={'space-y-2'}>
                <Label>Wiederkehrend</Label>
                <Separator />
                <div className={'grid gap-2'}>
                    {blockings
                        .filter((blocking) => blocking.repeat !== 'NEVER')
                        .map((blocking) => (
                            <BlockingCard key={blocking.id} blocking={blocking} />
                        ))}
                </div>
                <div>
                    {blockings.filter((blocking) => blocking.repeat !== 'NEVER').length < 1 && (
                        <NoBlockedSlots />
                    )}
                </div>
            </div>
            <div className={'space-y-2 mt-2'}>
                <Label>Einmalig</Label>
                <Separator />
                <div className={'grid gap-2'}>
                    {blockings
                        .filter((blocking) => blocking.repeat === 'NEVER')
                        .map((blocking) => (
                            <BlockingCard key={blocking.id} blocking={blocking} />
                        ))}
                </div>
                <div>
                    {blockings.filter((blocking) => blocking.repeat === 'NEVER').length < 1 && (
                        <NoBlockedSlots />
                    )}
                </div>
            </div>
        </div>
    );
};

const NoBlockedSlots = () => {
    return (
        <Card className={'shadow-none'}>
            <CardHeader>
                <CardTitle>Keine Blockierungen vorhanden</CardTitle>
                <CardDescription>
                    Füge eine neue Blockierung hinzu, um diese hier anzuzeigen.
                </CardDescription>
            </CardHeader>
        </Card>
    );
};

export default InstructorBlockingsPage;
