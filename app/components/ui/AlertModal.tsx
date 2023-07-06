import { Modal } from '~/components/ui/Modal';
import { ReactNode } from 'react';
import { Button } from '~/components/ui/Button';
import { Form } from '@remix-run/react';

interface AlertDialogProps {
    show: boolean;
    children: ReactNode;
}

export const AlertModal = ({ show, children }: AlertDialogProps) => {
    return (
        <Modal open={show}>
            <div>{children}</div>
            <Form method={'post'}>
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
