import { Dialog, Transition } from '@headlessui/react';
import type { ReactNode } from 'react';
import * as React from 'react';
import { Fragment } from 'react';
import { X } from 'lucide-react';

export const Modal = ({
    open,
    onClose,
    closable,
    backClickEnabled,
    children,
}: {
    open: boolean;
    closable?: boolean;
    onClose?: () => void;
    backClickEnabled?: boolean;
    children?: ReactNode;
}) => {
    return (
        <>
            <Transition appear show={open} as={Fragment}>
                <Dialog
                    as='div'
                    className='relative z-10'
                    onClose={() => (backClickEnabled && onClose ? onClose() : void 0)}>
                    <Transition.Child
                        as={Fragment}
                        enter='ease-out duration-300'
                        enterFrom='opacity-0'
                        enterTo='opacity-100'
                        leave='ease-in duration-200'
                        leaveFrom='opacity-100'
                        leaveTo='opacity-0'>
                        <div className='fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm' />
                    </Transition.Child>
                    <div className='fixed inset-0 overflow-y-auto'>
                        <div className='flex min-h-full items-center justify-center p-4 text-center'>
                            <Transition.Child
                                as={Fragment}
                                enter='ease-out duration-300'
                                enterFrom='opacity-0 scale-95'
                                enterTo='opacity-100 scale-100'
                                leave='ease-in duration-200'
                                leaveFrom='opacity-100 scale-100'
                                leaveTo='opacity-0 scale-95'>
                                <Dialog.Panel className='w-full max-w-lg lg:max-w-2xl transform rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all border border-card'>
                                    {closable && (
                                        <div
                                            onClick={onClose}
                                            className='absolute right-4 hover:cursor-pointer top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border'>
                                            <X className='h-4 w-4' />
                                            <span className='sr-only'>Close</span>
                                        </div>
                                    )}
                                    {children}
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>
    );
};
