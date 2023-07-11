import type { Registration } from '.prisma/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/Card';
import { Label } from '~/components/ui/Label';
import { DateTime } from 'luxon';
import { Form } from '@remix-run/react';
import { Button } from '~/components/ui/Button';

export interface PendingRegistrationProps {
    registration: Omit<Registration, 'createdAt'> & { createdAt: string };
}

export const PendingRegistration = ({ registration }: PendingRegistrationProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Einladung</CardTitle>
                <CardDescription>#{registration.id}</CardDescription>
            </CardHeader>
            <CardContent className={'space-y-4'}>
                <div>
                    <Label>Erstellt</Label>
                    <p className={'text-sm'}>
                        {DateTime.fromISO(registration.createdAt.toString()).toLocaleString(
                            DateTime.DATETIME_MED_WITH_SECONDS
                        )}
                    </p>
                </div>
                <div>
                    <Label>Einladungscode</Label>
                    <p className={'text-sm'}>{registration.code}</p>
                </div>
                <Form method={'post'}>
                    <div className={'flex justify-end gap-3'}>
                        <Button name={'intent'} value={'delete'} variant={'destructive'}>
                            Einladung löschen
                        </Button>
                        <Button name={'intent'} value={'regenerate'}>
                            Neu generieren
                        </Button>
                    </div>
                </Form>
            </CardContent>
        </Card>
    );
};
