import React from 'react';
import { cn } from '~/utils/css';
import { Link } from '@remix-run/react';

interface NavElement {
    name: string;
    href: string;
}

interface HorizontalNavProps extends React.HTMLAttributes<HTMLDivElement> {
    elements: NavElement[];
}

export const HorizontalNav = React.forwardRef<HTMLDivElement, HorizontalNavProps>(
    ({ className, elements, ...props }, ref) => {
        return (
            <div className={cn('flex items-center gap-2', className)} ref={ref} {...props}>
                {elements.map((element) => (
                    <Link
                        key={element.href}
                        to={element.href}
                        className={'py-1 hover:bg-gray-100 rounded-md text-base'}>
                        {element.name}
                    </Link>
                ))}
            </div>
        );
    }
);

HorizontalNav.displayName = 'HorizontalNav';
