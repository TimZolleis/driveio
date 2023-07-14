import type { DrivingSchool } from '.prisma/client';
import { Label } from '~/components/ui/Label';
import { Input } from '~/components/ui/Input';
import { Separator } from '~/components/ui/Seperator';
import { zfd } from 'zod-form-data';

export const drivingSchoolFormSchema = zfd.formData({
    name: zfd.text(),
    address: zfd.text(),
    contactFirstName: zfd.text(),
    contactLastName: zfd.text(),
    contactEmail: zfd.text(),
    contactPhone: zfd.text(),
});

export const DrivingSchoolForm = ({ drivingSchool }: { drivingSchool?: DrivingSchool | null }) => {
    return (
        <div className={'grid gap-4'}>
            <div className={'grid gap-2'}>
                <Label>Name</Label>
                <Input name={'name'} defaultValue={drivingSchool?.name}></Input>
            </div>
            <div className={'grid gap-2'}>
                <Label>Addresse</Label>
                <Input name={'address'} defaultValue={drivingSchool?.address}></Input>
            </div>
            <Separator />
            <div>
                <h4 className={'font-medium text-lg'}>Ansprechpartner</h4>
                <p className={'text-muted-foreground text-sm'}>
                    Generelle Kontaktinformationen für Fahrschüler
                </p>
            </div>
            <div className={'flex items-center gap-2 w-full'}>
                <div className={'grid gap-2 w-full'}>
                    <Label>Vorname</Label>
                    <Input
                        defaultValue={drivingSchool?.contactFirstName}
                        name={'contactFirstName'}
                    />
                </div>
                <div className={'grid gap-2 w-full'}>
                    <Label>Nachname</Label>
                    <Input defaultValue={drivingSchool?.contactLastName} name={'contactLastName'} />
                </div>
            </div>
            <div className={'flex items-center gap-2 w-full'}>
                <div className={'grid gap-2 w-full'}>
                    <Label>Email</Label>
                    <Input defaultValue={drivingSchool?.contactEmail} name={'contactEmail'} />
                </div>
                <div className={'grid gap-2 w-full'}>
                    <Label>Telefon</Label>
                    <Input defaultValue={drivingSchool?.contactPhone} name={'contactPhone'} />
                </div>
            </div>
        </div>
    );
};
