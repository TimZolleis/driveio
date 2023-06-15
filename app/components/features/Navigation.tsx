import { User } from '.prisma/client';
import { useOptionalUser } from '~/utils/hooks/user';

export const Navigation = () => {
    const user = useOptionalUser();
    return (
        <nav
            className={
                'w-full flex items-center justify-between px-10 py-3 border-b border-border'
            }>
            <div>
                <p className={'text-dodger-blue-700 font-semibold text-xl'}>drive.io</p>
            </div>
            <div>
                <p>{`${user?.firstName} ${user?.lastName}`}</p>
            </div>
        </nav>
    );
};
