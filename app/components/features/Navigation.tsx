import { useOptionalUser } from '~/utils/hooks/user';
import { Link } from '@remix-run/react';
import { UserMenu } from '~/components/features/user/UserMenu';

export const Navigation = () => {
    const user = useOptionalUser();
    return (
        <nav
            className={
                'w-full flex items-center justify-between px-10 py-3 border-b border-border'
            }>
            <div>
                <Link to={'/'} className={'text-dodger-blue-700 font-semibold text-xl'}>
                    drive.io
                </Link>
            </div>
            {user && <UserMenu user={user}></UserMenu>}
        </nav>
    );
};
