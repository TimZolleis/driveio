import { Button } from '~/components/ui/Button';

interface ModalButtonsProps {
    cancelText: string;
    confirmationText: string;
    isCancelling?: boolean;
    isSaving?: boolean;
}

export const ModalButtons = ({
    cancelText,
    confirmationText,
    isCancelling,
    isSaving,
}: ModalButtonsProps) => {
    return (
        <div className={'flex gap-3 justify-end mt-5'}>
            <Button isLoading={isCancelling} name={'intent'} value={'cancel'} variant={'secondary'}>
                {cancelText}
            </Button>
            <Button isLoading={isSaving} name={'intent'} value={'save'}>
                {confirmationText}
            </Button>
        </div>
    );
};
