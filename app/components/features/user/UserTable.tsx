import { User } from '.prisma/client';
import { ColumnDef } from '@tanstack/table-core';
import { DataTable } from '~/components/ui/DataTable';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '~/components/ui/Dropdown';
import { Button } from '~/components/ui/Button';
import { MoreHorizontal, Search } from 'lucide-react';
import { Link } from '@remix-run/react';
import { roles } from '~/messages/roles';
import { Badge } from '~/components/ui/Badge';
import { Input } from '~/components/ui/Input';
import { useState } from 'react';

export const columns: ColumnDef<User>[] = [
    {
        accessorKey: 'firstName',
        header: 'Vorname',
    },
    {
        accessorKey: 'lastName',
        header: 'Nachname',
    },
    {
        accessorKey: 'email',
        header: 'E-Mail',
    },
    {
        accessorKey: 'role',
        header: 'Rolle',
        cell: ({ row }) => {
            return <Badge>{roles[row.original.role]}</Badge>;
        },
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const user = row.original;
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant='ghost' className='h-8 w-8 p-0'>
                            <span className='sr-only'>Open menu</span>
                            <MoreHorizontal className='h-4 w-4' />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                        <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
                        <Link className={'hover:cursor-pointer'} to={`/users/${user.id}/edit`}>
                            <DropdownMenuItem>Benutzer bearbeiten</DropdownMenuItem>
                        </Link>
                        {user.role === 'STUDENT' && (
                            <Link className={'hover:cursor-pointer'} to={`/users/${user.id}/data`}>
                                <DropdownMenuItem>Stammdaten bearbeiten</DropdownMenuItem>
                            </Link>
                        )}
                        <DropdownMenuSeparator />
                        {user.role === 'STUDENT' && (
                            <Link
                                className={'text-amber-500'}
                                to={`/users/${user.id}/end-training`}>
                                <DropdownMenuItem>Ausbildung beenden</DropdownMenuItem>
                            </Link>
                        )}
                        <Link className={'text-destructive'} to={`/users/${user.id}/delete`}>
                            <DropdownMenuItem>Benutzer löschen</DropdownMenuItem>
                        </Link>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];

export const UserTable = ({ users }: { users: User[] }) => {
    const [filteredUsers, setFilteredUsers] = useState(users);

    const filterUsers = (term: string) => {
        setFilteredUsers(
            users.filter((user) => {
                return user.firstName.includes(term) || user.lastName.includes(term);
            })
        );
    };

    return (
        <div>
            <div className={'py-2 flex items-center gap-2'}>
                <Input
                    onChange={(event) => filterUsers(event.target.value)}
                    placeholder={'Benutzer suchen...'}
                    className={'max-w-md'}
                />
            </div>
            <DataTable columns={columns} data={filteredUsers}></DataTable>
        </div>
    );
};
