import { useOptionalUser } from '~/utils/hooks/user';
import { Link } from '@remix-run/react';
import { UserMenu } from '~/components/features/user/UserMenu';

export const Header = () => {
    const user = useOptionalUser();
    return (
        <nav
            className={
                'w-full flex items-center justify-between px-5 py-2 border-b backdrop-blur-lg border-border fixed z-20 h-[50px]'
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
