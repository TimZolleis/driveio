import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/Popover';
import { Button } from '~/components/ui/Button';
import { Calendar } from '~/components/ui/Calendar';
import { cn } from '~/utils/css';
import { de } from 'date-fns/locale';
import { Label } from '~/components/ui/Label';

export function DatePicker({
    name,
    defaultValue,
    required,
    error,
}: {
    name?: string;
    defaultValue?: Date;
    required?: boolean;
    error?: string;
}) {
    const [date, setDate] = React.useState<Date | undefined>(defaultValue);

    return (
        <div className={'w-full'}>
            <Popover>
                <input
                    type={'hidden'}
                    name={name || 'date'}
                    value={date ? date.toISOString() : undefined}
                />
                <PopoverTrigger className={'w-full'} asChild>
                    <Button
                        variant={'outline'}
                        className={cn(
                            'justify-start text-left font-normal',
                            !date && 'text-muted-foreground'
                        )}>
                        <CalendarIcon className='mr-2 h-4 w-4' />
                        {date ? format(date, 'PPP', { locale: de }) : <span>Datum auswählen</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0'>
                    <Calendar
                        required
                        mode='single'
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
            <Label color={'destructive'} variant={'description'}>
                {error}
            </Label>
        </div>
    );
}
