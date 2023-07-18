import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/Popover';
import { Button } from '~/components/ui/Button';
import { Calendar } from '~/components/ui/Calendar';
import { cn } from '~/utils/css';
import { de } from 'date-fns/locale';
import { Label } from '~/components/ui/Label';
import type { DebouncedFetcher, useDebounceFetcher } from '~/utils/form/debounce-fetcher';

export function DatePicker({
    name,
    defaultValue,
    error,
    autosave,
    fetcher,
}: {
    name?: string;
    defaultValue?: Date;
    error?: string;
    autosave?: boolean;
    fetcher?: DebouncedFetcher;
}) {
    const [date, setDate] = React.useState<Date | undefined>(defaultValue);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleSetDate = (date: Date | undefined) => {
        setDate(date);
        if (autosave && fetcher && inputRef.current) {
            fetcher.debounceSubmit(inputRef.current.form, { replace: true, debounceTimeout: 500 });
        }
    };

    return (
        <div className={'w-full'}>
            <Popover>
                <input
                    ref={inputRef}
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
                        onSelect={handleSetDate}
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
