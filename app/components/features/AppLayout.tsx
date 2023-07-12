import type { ReactNode } from 'react';
import { Navigation } from '~/components/features/Navigation';

export const AppLayout = ({ children }: { children: ReactNode }) => {
    return (
        <main className={''}>
            <Navigation />
            <div className={''}>{children}</div>
        </main>
    );
};
