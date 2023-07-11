import type { Registration } from '.prisma/client';
import { Car } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/Card';
import type { PendingRegistrationProps } from '~/components/features/user/Registration';
import { Label } from '~/components/ui/Label';
import { DateTime } from 'luxon';

export const RegistrationCard = ({ registration }: PendingRegistrationProps) => {
    return (
        <Card className={'shadow-none border-none'}>
            <CardHeader>
                <CardTitle>Einladung</CardTitle>
                <CardDescription>#{registration.id}</CardDescription>
            </CardHeader>
            <CardContent>
                <Label>Code</Label>
                <p className={'font-semibold text-2xl'}>{registration.code}</p>
                <Label>Erstellt am</Label>
                <p className={'font-semibold text-2xl'}>
                    {DateTime.fromISO(registration.createdAt.toString()).toLocaleString(
                        DateTime.DATETIME_MED_WITH_SECONDS
                    )}
                </p>
            </CardContent>
        </Card>
    );
};
