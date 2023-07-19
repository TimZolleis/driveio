import type { ROLE, User } from '.prisma/client';
import type { ColumnDef } from '@tanstack/table-core';
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
import { ArrowUpDown, MoreHorizontal, Search } from 'lucide-react';
import { Form, Link } from '@remix-run/react';
import { roles } from '~/messages/roles';
import { Badge } from '~/components/ui/Badge';
import { Input } from '~/components/ui/Input';
import { useState } from 'react';
import { useDoubleCheck } from '~/utils/general-utils';

export const columns: ColumnDef<User>[] = [
    {
        accessorKey: 'firstName',
        header: ({ column }) => {
            return (
                <Button
                    variant='invisible'
                    size={'invisible'}
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Vorname
                    <ArrowUpDown className=' h-4 w-4' />
                </Button>
            );
        },
    },
    {
        accessorKey: 'lastName',
        header: ({ column }) => {
            return (
                <Button
                    variant='invisible'
                    size={'invisible'}
                    className={'p-0'}
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Nachname
                    <ArrowUpDown className=' h-4 w-4' />
                </Button>
            );
        },
    },
    {
        accessorKey: 'email',
        header: ({ column }) => {
            return (
                <Button
                    variant='invisible'
                    size={'invisible'}
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Email
                    <ArrowUpDown className='h-4 w-4' />
                </Button>
            );
        },
    },
    {
        accessorKey: 'role',
        header: ({ column }) => {
            return (
                <Button
                    variant='invisible'
                    size={'invisible'}
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Rolle
                    <ArrowUpDown className=' h-4 w-4' />
                </Button>
            );
        },
        cell: ({ row }) => {
            const roleKey = row.original.role.toLowerCase() as Lowercase<ROLE>;
            return <Badge variant={roleKey}>{roles[row.original.role]}</Badge>;
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
