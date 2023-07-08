import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '~/components/ui/Dropdown';
import { Button } from '~/components/ui/Button';
import { MixerHorizontalIcon } from '@radix-ui/react-icons';

export interface LessonViewOption {
    name: string;
    value: string;
}

const options = [
    {
        name: 'Zeige vergangene Fahrstunden',
        value: 'showExpiredLessons',
    },
];

export const LessonViewOptions = ({
    checked,
    setChecked,
}: {
    checked: LessonViewOption[];
    setChecked: (lessonViewOption: LessonViewOption, value: boolean) => void;
}) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant='outline' size='sm' className='hidden h-8 lg:flex'>
                    <MixerHorizontalIcon className='mr-2 h-4 w-4' />
                    Filter
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className=''>
                {options.map((option) => (
                    <DropdownMenuCheckboxItem
                        key={option.value}
                        checked={
                            !!checked.find((checkedOption) => checkedOption.value === option.value)
                        }
                        onCheckedChange={(value) => setChecked(option, value)}>
                        {option.name}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
