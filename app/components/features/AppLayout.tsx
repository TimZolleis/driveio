import type { ReactNode } from 'react';
import { Navigation } from '~/components/features/Navigation';

export const AppLayout = ({ children }: { children: ReactNode }) => {
    return (
        <main className={''}>
            <Navigation />
            <div className={'px-5 md:px-10 py-5'}>{children}</div>
        </main>
    );
};
