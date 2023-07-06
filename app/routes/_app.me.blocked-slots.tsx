import { Link, Outlet, useLoaderData } from '@remix-run/react';
import { Separator } from '~/components/ui/Seperator';
import { buttonVariants } from '~/components/ui/Button';
import type { DataFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { requireManagementPermissions } from '~/utils/user/user.server';
import { prisma } from '../../prisma/db';
import { Label } from '~/components/ui/Label';
import { BlockedSlotCard } from '~/components/features/blocked-slots/BlockedSlotCard';
import { Card, CardDescription, CardHeader, CardTitle } from '~/components/ui/Card';

export const loader = async ({ request, params }: DataFunctionArgs) => {
    const user = await requireManagementPermissions(request);
    const blockedSlots = await prisma.blockedSlot.findMany({ where: { userId: user.id } });

    return json({ blockedSlots });
};

export const action = async ({ request, params }: DataFunctionArgs) => {
    await requireManagementPermissions(request);
    const blockedSlotId = await request
        .formData()
        .then((data) => data.get('blockedSlot')?.toString());
    await prisma.blockedSlot.delete({ where: { id: blockedSlotId } });
    return null;
};

const InstructorBlockedSlotsPage = () => {
    const { blockedSlots } = useLoaderData<typeof loader>();
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
                    {blockedSlots
                        .filter((blockedSlot) => blockedSlot.repeat !== 'NEVER')
                        .map((blockedSlot) => (
                            <BlockedSlotCard key={blockedSlot.id} blockedSlot={blockedSlot} />
                        ))}
                </div>
                <div>
                    {blockedSlots.filter((blockedSlot) => blockedSlot.repeat !== 'NEVER').length <
                        1 && <NoBlockedSlots />}
                </div>
            </div>
            <div className={'space-y-2 mt-2'}>
                <Label>Einmalig</Label>
                <Separator />
                <div className={'grid gap-2'}>
                    {blockedSlots
                        .filter((blockedSlot) => blockedSlot.repeat === 'NEVER')
                        .map((blockedSlot) => (
                            <BlockedSlotCard key={blockedSlot.id} blockedSlot={blockedSlot} />
                        ))}
                </div>
                <div>
                    {blockedSlots.filter((blockedSlot) => blockedSlot.repeat === 'NEVER').length <
                        1 && <NoBlockedSlots />}
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

export default InstructorBlockedSlotsPage;
