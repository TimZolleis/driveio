import { Alert, AlertDescription, AlertTitle } from '~/components/ui/Alert';
import { AlertOctagon } from 'lucide-react';
import { errors } from '~/messages/errors';
import { Link } from '@remix-run/react';
import { buttonVariants } from '~/components/ui/Button';

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
