import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '~/components/ui/Dropdown';
import { Button } from '~/components/ui/Button';
import type { User } from '.prisma/client';
import { Link } from '@remix-run/react';

export const UserMenu = ({ user }: { user: User }) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
                    <p>{user.firstName}</p>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='w-56' align='end' forceMount>
                <DropdownMenuLabel className='font-normal'>
                    <div className='flex flex-col space-y-1'>
                        <p className='text-sm font-medium leading-none'>
                            {user.firstName} {user.lastName}
                        </p>
                        <p className='text-xs leading-none text-muted-foreground'>{user.email}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    {user.role === 'STUDENT' && (
                        <>
                            <Link to={'/student'}>
                                <DropdownMenuItem>Übersicht</DropdownMenuItem>
                            </Link>
                            <Link to={'/book'}>
                                <DropdownMenuItem>Fahrstunden buchen</DropdownMenuItem>
                            </Link>
                        </>
                    )}
                    {user.role !== 'STUDENT' && (
                        <>
                            <Link to={'/users'}>
                                <DropdownMenuItem>Benutzer</DropdownMenuItem>
                            </Link>
                        </>
                    )}
                    {user.role === 'INSTRUCTOR' && (
                        <>
                            <Link to={'/lessons'}>
                                <DropdownMenuItem>Fahrstunden</DropdownMenuItem>
                            </Link>
                            <Link to={'/me'}>
                                <DropdownMenuItem>Einstellungen</DropdownMenuItem>
                            </Link>
                        </>
                    )}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <Link to={'/logout'}>
                    <DropdownMenuItem>Abmelden</DropdownMenuItem>
                </Link>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
