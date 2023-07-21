export const UserFormSkeleton = () => {
    return (
        <>
            <div className={'grid grid-cols-2 gap-2'}>
                <Skeleton height={40} />
                <Skeleton height={40} />
                <Skeleton height={40} />
                <Skeleton height={40} />
            </div>
        </>
    );
};

export const Skeleton = ({ width, height }: { width?: number; height: number }) => {
    return (
        <div
            className={'rounded-md bg-gray-200 animate-pulse w-full'}
            style={{ maxWidth: width, height }}></div>
    );
};
