import { ReactNode } from 'react';

export const PageHeader = ({ children }: { children?: ReactNode }) => {
    return <h1 className={'text-2xl font-semibold text-primary'}>{children}</h1>;
};
