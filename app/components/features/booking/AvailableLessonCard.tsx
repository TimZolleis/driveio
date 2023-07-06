import type { TimeSlot } from '~/utils/booking/calculate-available-slots.server';
import { Button } from '~/components/ui/Button';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '~/components/ui/AlertDialog';
import { Form } from '@remix-run/react';
import { Label } from '~/components/ui/Label';
import { Textarea } from '~/components/ui/TextArea';

export const AvailableLessonCard = ({ slot }: { slot: TimeSlot }) => {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <div className={'rounded-md p-3 border hover:bg-muted hover:cursor-pointer'}>
                    <p className={'text-sm font-medium'}>
                        {slot.start}-{slot.end}
                    </p>
                </div>
            </AlertDialogTrigger>

            <AlertDialogContent>
                <Form method={'POST'}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Fahrstunde anfragen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hiermit wird die Fahrstunde von{' '}
                            <span className={'font-medium'}>
                                {slot.start} - {slot.end}
                            </span>{' '}
                            bei deinem Fahrlehrer angefragt.
                        </AlertDialogDescription>
                        <div className={'grid gap-2'}>
                            <Label>Details (optional)</Label>
                            <Textarea name={'description'}></Textarea>
                        </div>
                    </AlertDialogHeader>

                    <AlertDialogFooter className={'mt-3'}>
                        <AlertDialogCancel>Abbruch</AlertDialogCancel>
                        <input type='hidden' name='slotStart' value={slot.start} />
                        <input type='hidden' name='slotEnd' value={slot.end} />
                        <Button>Bestätigen</Button>
                    </AlertDialogFooter>
                </Form>
            </AlertDialogContent>
        </AlertDialog>
    );
};
