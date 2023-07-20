import { Alert, AlertDescription, AlertTitle } from '~/components/ui/Alert';
import { AlertOctagon, Plus } from 'lucide-react';
import { errors } from '~/messages/errors';
import { Link } from '@remix-run/react';
import { buttonVariants } from '~/components/ui/Button';
import { Card, CardContent } from '~/components/ui/Card';
import { cn } from '~/utils/css';
import type { ReactNode, RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

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
        <Card
            className={
                'shadow-none w-full flex flex-col justify-center text-center relative select-none'
            }>
            <CardContent className={'flex flex-col items-center w-full'}>
                <img className={'max-w-[200px]'} src={image} alt='' />
                <p className={'text-xl text-primary font-semibold'}>{title}</p>
                <p className={'text-muted-foreground text-sm'}>{description}</p>
                <div className={'mt-4'}>{children}</div>
            </CardContent>
        </Card>
    );
};

export function useFollowPointer(ref: RefObject<HTMLElement>) {
    const [point, setPoint] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (!ref.current) return;

        const handlePointerMove = ({ clientX, clientY }: MouseEvent) => {
            const element = ref.current!;

            const x = clientX - element.offsetLeft - element.offsetWidth / 2;
            const y = clientY - element.offsetTop - element.offsetHeight / 2;
            setPoint({ x, y });
        };

        window.addEventListener('pointermove', handlePointerMove);

        return () => window.removeEventListener('pointermove', handlePointerMove);
    }, []);

    return point;
}

const PlayCursor = () => {
    const ref = useRef(null);
    const { x, y } = useFollowPointer(ref);

    return (
        <motion.div
            ref={ref}
            className='h-10 w-10 bg-red-500 rounded-full absolute'
            animate={{ x, y }}
            transition={{
                type: 'spring',
                damping: 3,
                stiffness: 50,
                restDelta: 0.001,
            }}
        />
    );
};
