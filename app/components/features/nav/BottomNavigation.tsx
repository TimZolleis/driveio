import { Form, Link, NavLink } from '@remix-run/react';
import { Calendar, Home, List, LogOut, Plus, Settings } from 'lucide-react';
import { cn } from '~/utils/css';
import { cva } from 'class-variance-authority';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { getBookingLink } from '~/utils/general-utils';

const linkContainerVariants = cva('p-3 rounded-xl', {
    variants: {
        variant: {
            active: 'bg-primary/10',
        },
    },
});

const linkContainerAnimationVariants = {
    hover: {
        scale: 1.2,
        y: -5,
        rotate: 10,
    },
};

const linkIconVariants = cva('w-6 h-6', {
    variants: {
        variant: {
            default: 'text-gray-400',
            active: 'text-primary',
        },
    },
    defaultVariants: {
        variant: 'default',
    },
});

export const BottomNavigation = () => {
    return (
        <div
            className={
                'flex sm:hidden w-full bg-white z-30 fixed bottom-0 border-t h-[90px] items-center justify-evenly px-10 pb-5'
            }>
            <NavLink to={'/student'}>
                {({ isActive }) => (
                    <IconContainer isActive={isActive}>
                        <List
                            className={linkIconVariants({
                                variant: isActive ? 'active' : 'default',
                            })}
                        />
                    </IconContainer>
                )}
            </NavLink>
            <NavLink to={'/calendar'}>
                {({ isActive }) => (
                    <IconContainer isActive={isActive}>
                        <Calendar
                            className={linkIconVariants({
                                variant: isActive ? 'active' : 'default',
                            })}
                        />
                    </IconContainer>
                )}
            </NavLink>
            <NavLink to={getBookingLink()}>
                {({ isActive }) => (
                    <motion.div
                        whileHover={{ scale: 1.3, y: -20, rotate: 90 }}
                        className={'rounded-full p-3 bg-primary shadow-lg shadow-primary/20'}>
                        <Plus className={'text-white h-8 w-8'} />
                    </motion.div>
                )}
            </NavLink>
            <NavLink to={'/me'}>
                {({ isActive }) => (
                    <IconContainer isActive={isActive}>
                        <Settings
                            className={linkIconVariants({
                                variant: isActive ? 'active' : 'default',
                            })}
                        />
                    </IconContainer>
                )}
            </NavLink>
            <Form method={'post'} action={'/logout'}>
                <IconContainer>
                    <button>
                        <LogOut className={linkIconVariants({ variant: 'default' })} />
                    </button>
                </IconContainer>
            </Form>
        </div>
    );
};

const IconContainer = ({ isActive, children }: { isActive?: boolean; children: ReactNode }) => {
    return (
        <motion.div
            variants={linkContainerAnimationVariants}
            whileHover={'hover'}
            className={linkContainerVariants({
                variant: isActive ? 'active' : undefined,
            })}>
            {children}
        </motion.div>
    );
};
