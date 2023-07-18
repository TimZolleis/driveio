import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '~/components/ui/Command';
import { useRef, useState } from 'react';
import type { BingMapsLocation } from '~/types/bing-maps-location';
import type { DebouncedFetcher } from '~/utils/form/debounce-fetcher';
import { Label } from '~/components/ui/Label';
import * as React from 'react';

export const AddressCombobox = ({
    results,
    onInput,
    defaultLocation,
    autosave,
    fetcher,
    error,
}: {
    results: BingMapsLocation[];
    onInput: (event: string) => void;
    defaultLocation?: BingMapsLocation;
    autosave?: boolean;
    fetcher?: DebouncedFetcher;
    error?: string;
}) => {
    const [searchValue, setSearchValue] = useState(defaultLocation?.address.formattedAddress || '');
    const [showResults, setShowResults] = useState(false);
    const [pickupLocation, setPickupLocation] = useState<BingMapsLocation | undefined>(
        defaultLocation
    );
    const inputRef = useRef<HTMLInputElement>(null);
    const handleSelect = (location: BingMapsLocation) => {
        setSearchValue(location.address.formattedAddress);
        setPickupLocation(pickupLocation === location ? undefined : location);
        setShowResults(false);
        if (autosave && fetcher && inputRef.current) {
            fetcher.debounceSubmit(inputRef.current.form, { replace: true, debounceTimeout: 500 });
        }
    };

    return (
        <div>
            <Command>
                <CommandInput
                    value={searchValue}
                    name={'query'}
                    onFocus={() => setShowResults(true)}
                    onValueChange={(query) => {
                        setSearchValue(query);
                        onInput(searchValue);
                    }}
                    placeholder='Addresse suchen...'
                />
                {showResults && (
                    <div className={''}>
                        <div
                            className={
                                'absolute z-100 w-full max-w-md rounded-md shadow-md border border-input bg-white'
                            }>
                            <CommandList>
                                <CommandEmpty>No results found.</CommandEmpty>
                                <CommandGroup heading='Vorschläge'>
                                    {results.map((location) => (
                                        <CommandItem
                                            onSelect={(value) => {
                                                handleSelect(location);
                                            }}
                                            key={location.address.formattedAddress}>
                                            {location.address.formattedAddress}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </div>
                    </div>
                )}
            </Command>
            <Label variant={'description'} color={'destructive'}>
                {error}
            </Label>
            <input
                ref={inputRef}
                type='hidden'
                name={'pickupLat'}
                value={pickupLocation?.point.coordinates[0]}
            />
            <input type='hidden' name={'pickupLng'} value={pickupLocation?.point.coordinates[1]} />
        </div>
    );
};
