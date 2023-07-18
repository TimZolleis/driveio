import { motion } from 'framer-motion';
import { Loader } from '~/components/ui/Loader';
const LoaderPage = () => {
    return (
        <div className={'relative bg-red-100'}>
            <Loader />
        </div>
    );
};

export default LoaderPage;
