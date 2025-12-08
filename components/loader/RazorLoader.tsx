'use client';

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface RazorLoaderProps {
  message?: string;
}

const RazorLoader: React.FC<RazorLoaderProps> = ({ message = 'Initiating your payment...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[150px] gap-4 text-center text-blue-600">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
      >
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-lg font-medium text-gray-800"
      >
        {message}
      </motion.p>
    </div>
  );
};

export default RazorLoader;
