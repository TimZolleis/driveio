import { Modal } from '~/components/ui/Modal';
import type { ReactNode } from 'react';
import { Button } from '~/components/ui/Button';
import { Form } from '@remix-run/react';

interface AlertDialogProps {
    show: boolean;
    children: ReactNode;
}

export type AlertModalIntent = 'cancel' | 'confirm';

export const AlertModal = ({ show, children }: AlertDialogProps) => {
    return (
        <Modal open={show}>
            <Form method={'post'}>
                <div>{children}</div>

                <div className={'flex gap-2 items-center justify-end'}>
                    <Button variant={'outline'} name={'intent'} value={'cancel'}>
                        Abbruch
                    </Button>
                    <Button name={'intent'} value={'confirm'}>
                        Bestätigen
                    </Button>
                </div>
            </Form>
        </Modal>
    );
};
