import React from 'react';
import hestiaLogo from '../assets/Hestia logo.png';

export default function Loader({ fullScreen = false }) {
  const containerClasses = fullScreen 
    ? "fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg)] bg-opacity-90 backdrop-blur-sm"
    : "flex items-center justify-center p-8 w-full h-full min-h-[200px]";

  return (
    <div className={containerClasses}>
      <img 
        src={hestiaLogo} 
        alt="Loading..." 
        className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 object-contain animate-breathe drop-shadow-[0_0_15px_rgba(255,0,127,0.5)] sm:drop-shadow-[0_0_20px_rgba(255,0,127,0.5)]" 
      />
    </div>
  );
}
