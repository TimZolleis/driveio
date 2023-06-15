import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '~/components/ui/Command';
import { useState } from 'react';
import type { BingMapsLocation } from '~/types/bing-maps-location';

export const AddressCombobox = ({
    results,
    onInput,
}: {
    results: BingMapsLocation[];
    onInput: (event: string) => void;
}) => {
    const [searchValue, setSearchValue] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [pickupLocation, setPickupLocation] = useState<BingMapsLocation | undefined>(undefined);

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
                                                setSearchValue(location.address.formattedAddress);
                                                setPickupLocation(
                                                    pickupLocation === location
                                                        ? undefined
                                                        : location
                                                );
                                                setShowResults(false);
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
            <input type='hidden' name={'addressLat'} value={pickupLocation?.point.coordinates[0]} />
            <input type='hidden' name={'addressLng'} value={pickupLocation?.point.coordinates[1]} />
        </div>
    );
};
