import React from 'react';

const Loader = ({ transparent = false }: { transparent?: boolean }) => (
  <div className={`fixed inset-0 z-[100] flex items-center justify-center ${transparent ? '' : 'bg-slate-900/70 backdrop-blur-sm'}`}>
    <div className="flex flex-col items-center">
      <div className="relative w-16 h-16">
        <span className="absolute inline-block w-full h-full animate-spin rounded-full border-4 border-yellow-400 border-t-transparent"></span>
        <span className="absolute inline-block w-8 h-8 left-4 top-4 bg-yellow-400 rounded-full animate-pulse"></span>
      </div>
      <span className="mt-6 text-yellow-400 text-lg font-semibold tracking-wide animate-pulse">Loading...</span>
    </div>
  </div>
);

export default Loader; 