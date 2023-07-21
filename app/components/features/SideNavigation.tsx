import { cn } from '~/utils/css';
import { Link, NavLink } from '@remix-run/react';
import type * as TabsPrimitive from '@radix-ui/react-tabs';
import { buttonVariants } from '~/components/ui/Button';
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/Tabs';
import { cva } from 'class-variance-authority';
import { AnimatePresence, motion } from 'framer-motion';

interface NavProps {
    items: {
        href: string;
        title: string;
        show: boolean;
    }[];
}

interface TopNavProps extends React.ComponentProps<typeof TabsPrimitive.Root>, NavProps {}

const topNavigationVariants = cva(
    'relative inline-flex items-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    {
        variants: {
            variant: {
                inactive: '',
                active: 'bg-background text-foreground shadow-sm',
            },
        },
        defaultVariants: {
            variant: 'inactive',
        },
    }
);

export function TopNavigation({ className, items, ...props }: TopNavProps) {
    return (
        <AnimatePresence>
            <Tabs
                className={cn('flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1', className)}
                {...props}>
                <TabsList>
                    <motion.div layout={true}>
                        {items.map(
                            (item, index) =>
                                item.show && (
                                    <NavLink
                                        key={item.href}
                                        end={true}
                                        to={item.href}
                                        className={(active) =>
                                            topNavigationVariants({
                                                variant: active.isActive ? 'active' : 'inactive',
                                            })
                                        }>
                                        {({ isActive, isPending }) => (
                                            <div>
                                                <p className={'relative z-10'}>{item.title}</p>
                                                {isActive && (
                                                    <motion.span
                                                        layoutId='bubble'
                                                        className={
                                                            'absolute inset-0 bg-white mix-blend-lighten'
                                                        }
                                                        style={{ borderRadius: '6px' }}
                                                        transition={{
                                                            type: 'spring',
                                                            bounce: 0.2,
                                                            duration: 0.6,
                                                        }}></motion.span>
                                                )}
                                            </div>
                                        )}
                                    </NavLink>
                                )
                        )}
                    </motion.div>
                </TabsList>
            </Tabs>
        </AnimatePresence>
    );
}
