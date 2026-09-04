import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingState = ({ message = 'Loading details...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center my-6 bg-white border-2 border-dark-neutral rounded-md shadow-brutal-sm">
      <div className="w-12 h-12 rounded-md bg-forest-green-light border-2 border-dark-neutral flex items-center justify-center mb-3 shadow-[2px_2px_0px_#22252A]">
        <Loader2 className="w-6 h-6 text-forest-green animate-spin" />
      </div>
      <p className="text-dark-neutral font-bold text-sm tracking-tight">{message}</p>
    </div>
  );
};

export default LoadingState;
