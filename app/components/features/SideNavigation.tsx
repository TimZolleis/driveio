import { cn } from '~/utils/css';
import { Link, NavLink } from '@remix-run/react';
import { buttonVariants } from '~/components/ui/Button';
import React from 'react';

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
    items: {
        href: string;
        title: string;
        show: boolean;
    }[];
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
    return (
        <nav
            className={cn('flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1', className)}
            {...props}>
            {items.map(
                (item) =>
                    item.show && (
                        <NavLink
                            key={item.href}
                            end={true}
                            to={item.href}
                            className={(active) =>
                                cn(
                                    buttonVariants({ variant: 'ghost' }),
                                    active.isActive
                                        ? 'bg-muted hover:bg-muted'
                                        : 'hover:bg-transparent hover:underline',
                                    'justify-start'
                                )
                            }>
                            {item.title}
                        </NavLink>
                    )
            )}
        </nav>
    );
}
