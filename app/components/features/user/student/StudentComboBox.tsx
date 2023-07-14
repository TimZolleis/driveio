import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '~/components/ui/Command';
import type { User } from '.prisma/client';
import { useState } from 'react';

export const StudentComboBox = ({ students }: { students: User[] }) => {
    const [searchValue, setSearchValue] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
    const [showResults, setShowResults] = useState(false);
    const filteredStudents = students.filter((student) => {
        return student.firstName.includes(searchValue) || student.lastName.includes(searchValue);
    });

    return (
        <div>
            <Command>
                <CommandInput
                    onFocus={() => setShowResults(true)}
                    value={searchValue}
                    name={'query'}
                    onValueChange={(query) => {
                        setSearchValue(query);
                    }}
                    placeholder='Fahrschüler suchen...'
                />
                {showResults && (
                    <div>
                        <div
                            className={
                                'absolute z-100 w-full max-w-md rounded-md shadow-md border border-input bg-white'
                            }>
                            <CommandList>
                                <CommandEmpty>Keine Fahrschüler gefunden</CommandEmpty>
                                <CommandGroup heading='Vorschläge'>
                                    {filteredStudents.map((student) => (
                                        <CommandItem
                                            onSelect={(value) => {
                                                setSearchValue(
                                                    `${student.firstName} ${student.lastName}`
                                                );
                                                setSelectedStudent(student);
                                                setShowResults(false);
                                            }}
                                            key={student.id}>
                                            {student.firstName} {student.lastName}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </div>
                    </div>
                )}
            </Command>
            <input type='hidden' name={'student'} value={selectedStudent?.id} />
        </div>
    );
};
