import { useNavigation } from '@remix-run/react';

export function useModalFormState() {
    const navigation = useNavigation();
    const isSaving =
        navigation.state === 'submitting' && navigation.formData?.get('intent') === 'save';
    const isCancelling =
        navigation.state === 'submitting' && navigation.formData?.get('intent') === 'cancel';
    return { isSaving, isCancelling };
}
