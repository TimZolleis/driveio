import { Input } from '~/components/ui/Input';
import type { MutableRefObject } from 'react';
import React, { useRef } from 'react';

interface CodeInputProps {
    length?: number;
    name?: string;
}

export const CodeInput = ({ length, name }: CodeInputProps) => {
    const itemRefs: MutableRefObject<HTMLInputElement[]> = useRef<HTMLInputElement[]>([]);
    const focusElement = (event: React.FormEvent<HTMLInputElement>, elementIndex: number) => {
        const nativeEvent = event.nativeEvent as InputEvent;
        switch (nativeEvent.inputType) {
            case 'insertText': {
                const element = itemRefs.current[elementIndex + 1];
                if (element) {
                    element.focus();
                }
                break;
            }
            case 'deleteContentBackward': {
                const element = itemRefs.current[elementIndex - 1];
                if (element) {
                    element.focus();
                }
                break;
            }
        }
    };
    return (
        <div className={'flex justify-center w-full'}>
            <div className={'flex items-center gap-2'}>
                {new Array(length || 6).fill('').map((value, index) => (
                    <Input
                        name={name}
                        className={'text-center font-medium text-lg'}
                        onInput={(event) => focusElement(event, index)}
                        ref={(element) => {
                            if (element) {
                                itemRefs.current.push(element);
                            }
                        }}
                        maxLength={1}
                        key={index}
                        inputMode={'numeric'}
                    />
                ))}
            </div>
        </div>
    );
};
