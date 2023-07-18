import { Divide } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '~/utils/css';

const bars = Array(12).fill(0);
const childVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: [0.15, 1, 0.15], transition: { repeat: Infinity, duration: 1.2 } },
};

const containerVariants = {
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

export const Loader = ({ size = 30, className }: { size?: number; className?: string }) => {
    return (
        <div style={{ height: `${size}px`, width: `${size}px` }}>
            <motion.div
                variants={containerVariants}
                animate={'visible'}
                initial={'hidden'}
                className={'relative top-1/2 left-1/2'}
                style={{ height: `${size}px`, width: `${size}px` }}>
                {bars.map((_, i) => (
                    <motion.div
                        key={i}
                        variants={childVariants}
                        className={cn(
                            'bg-gray-600 absolute h-[8%] -left-[10%] -top-[3.9%] w-[24%]',
                            className
                        )}
                        style={{
                            transform: `rotate(${(i + 1) * 30}deg) translate(146%)`,
                        }}></motion.div>
                ))}
            </motion.div>
        </div>
    );
};
