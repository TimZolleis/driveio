import { Alert, AlertDescription, AlertTitle } from '~/components/ui/Alert';
import { AlertOctagon, Plus } from 'lucide-react';
import { errors } from '~/messages/errors';
import { Link } from '@remix-run/react';
import { buttonVariants } from '~/components/ui/Button';
import { Card, CardContent } from '~/components/ui/Card';
import { cn } from '~/utils/css';
import type { ReactNode } from 'react';

export const ErrorComponent = ({ error }: { error: unknown }) => {
    return (
        <Alert className={'space-x-6'}>
            <AlertOctagon className='h-8 w-8' />
            <AlertTitle>Fehler</AlertTitle>
            <AlertDescription>
                {error instanceof Error ? error.message : errors.unknown}
            </AlertDescription>
            <div className={'py-3 flex items-center w-full'}>
                <Link to={'/'} className={buttonVariants()}>
                    Zurück zur Startseite
                </Link>
            </div>
        </Alert>
    );
};

export const ErrorCard = ({
    title,
    description,
    image,
    children,
}: {
    title: string;
    description: string;
    image: string;
    children?: ReactNode;
}) => {
    return (
        <Card className={'shadow-none w-full flex flex-col justify-center text-center'}>
            <CardContent className={'flex flex-col items-center w-full'}>
                <img className={'max-w-[200px]'} src={image} alt='' />
                <p className={'text-xl text-primary font-semibold'}>{title}</p>
                <p className={'text-muted-foreground text-sm'}>{description}</p>
                <div className={'mt-4'}>{children}</div>
            </CardContent>
        </Card>
    );
};
