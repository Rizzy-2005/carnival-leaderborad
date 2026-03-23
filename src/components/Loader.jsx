import React from 'react';
import hestiaLogo from '../assets/Hestia logo.png';

export default function Loader({ fullScreen = false }) {
  const containerClasses = fullScreen
    ? "fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg)] bg-opacity-90 backdrop-blur-sm"
    : "flex items-center justify-center w-full min-h-[50vh] p-4";

  return (
    <div className={containerClasses}>
      <img
        src={hestiaLogo}
        alt="Loading..."
        className="w-14 h-14 sm:w-20 sm:h-20 lg:w-32 lg:h-32 object-contain animate-breathe drop-shadow-[0_0_10px_rgba(255,0,127,0.5)] sm:drop-shadow-[0_0_20px_rgba(255,0,127,0.5)]"
      />
    </div>
  );
}
