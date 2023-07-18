export const ImageCropper = ({ src }: { src: string }) => {
    return (
        <div className={'overflow-hidden aspect-square'}>
            <img className={'relative w-auto h-full max-w-none max-h-none'} src={src} />
        </div>
    );
};
