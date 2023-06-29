import { Blocking } from '.prisma/client';
import { DateTime } from 'luxon';
import { Badge } from '~/components/ui/Badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '~/components/ui/Dropdown';
import { Button } from '~/components/ui/Button';
import { MoreVertical } from 'lucide-react';
import { Form, Link, useFetcher } from '@remix-run/react';

const repeat = {
    NEVER: 'Nie',
    DAILY: 'Täglich',
    WEEKLY: 'Wöchentlich',
    MONTHLY: 'Monatlich',
    YEARLY: 'Jährlich',
};

export const BlockingCard = ({ blocking }: { blocking: Blocking }) => {
    const fetcher = useFetcher();
    return (
        <div className={'p-3 rounded-md border text-sm flex justify-between items-center'}>
            <div>
                <div className={'flex items-center gap-2'}>
                    <p className={'font-medium'}>{blocking.name}</p>
                    <Badge variant={'outline'}>{repeat[blocking.repeat]}</Badge>
                </div>
                <p className={'text-muted-foreground mt-1'}>
                    {DateTime.fromISO(blocking.startDate).toLocaleString(DateTime.DATETIME_MED)} -{' '}
                    {DateTime.fromISO(blocking.endDate).toLocaleString(DateTime.DATETIME_MED)}
                </p>
            </div>
            <div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant='ghost' className='h-8 w-8 p-0'>
                            <span className='sr-only'>Open menu</span>
                            <MoreVertical className='h-4 w-4' />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                        <Link to={blocking.id}>
                            <DropdownMenuItem>Bearbeiten</DropdownMenuItem>
                        </Link>
                        <Form method={'POST'} className={'w-full'}>
                            {/*TODO: REVISE CLICKABILITY*/}
                            <DropdownMenuItem
                                onClick={() =>
                                    fetcher.submit({ blocking: blocking.id }, { method: 'POST' })
                                }>
                                Löschen
                            </DropdownMenuItem>
                        </Form>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};
