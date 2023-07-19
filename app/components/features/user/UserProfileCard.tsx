import type { User } from '.prisma/client';
import { Mail, Phone } from 'lucide-react';
import { Link } from '@remix-run/react';

export const UserProfileCard = ({ user }: { user: User }) => {
    return (
        <div className={'p-4 rounded-md border shadow-sm flex justify-between items-center'}>
            <div>
                <p className={'text-xs text-muted-foreground'}>Dein Ansprechpartner</p>
                <p className={'font-semibold'}>
                    {user.firstName} {user.lastName}
                </p>
            </div>
            <div className={'flex items-center gap-2'}>
                <div className={'w-10 h-10 rounded-full flex items-center justify-center border'}>
                    <Link to={`tel:${user.phone}`}>
                        <Phone size={18} className={'text-gray-500 '}></Phone>
                    </Link>
                </div>
                <div className={'w-10 h-10 rounded-full flex items-center justify-center border'}>
                    <Link to={`mailto:${user.email}`}>
                        <Mail size={18} className={'text-gray-500 '}></Mail>
                    </Link>
                </div>
            </div>
        </div>
    );
};
