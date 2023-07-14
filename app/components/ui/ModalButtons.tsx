import { Button } from '~/components/ui/Button';

export const ModalButtons = ({
    cancelText,
    confirmationText,
}: {
    cancelText: string;
    confirmationText: string;
}) => {
    return (
        <div className={'flex gap-3 justify-end mt-5'}>
            <Button name={'intent'} value={'cancel'} variant={'secondary'}>
                {cancelText}
            </Button>
            <Button name={'intent'} value={'save'}>
                {confirmationText}
            </Button>
        </div>
    );
};
