import type { ReactNode } from 'react';
import { Navigation } from '~/components/features/Navigation';

export const AppLayout = ({ children }: { children: ReactNode }) => {
    return (
        <main className={'font-inter text-base font-normal'}>
            <Navigation />
            <div className={''}>{children}</div>
        </main>
    );
};
