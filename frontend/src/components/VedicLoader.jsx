import React from 'react';

/**
 * VedicLoader - A premium loading component for VedicScan
 * Uses the book animation defined in index.css
 */
const VedicLoader = ({ fullScreen = false, message = "Consulting the stars..." }) => {
  const loaderContent = (
    <div className="flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
      {/* Book Animation (CSS-based) */}
      <div className="book-container mb-8 scale-150">
        <div className="book">
          <div className="book-cover-back"></div>
          <div className="book-pages-bg"></div>
          <div className="page page-1"></div>
          <div className="page page-2"></div>
          <div className="page page-3"></div>
          <div className="page page-4"></div>
          <div className="page page-5"></div>
          <div className="book-cover-front"></div>
        </div>
      </div>
      <div className="relative">
        <h3 className="text-xl font-playfair font-bold text-maroon mb-2">
          {message}
        </h3>
        <div className="flex justify-center gap-1">
          <div className="w-1.5 h-1.5 bg-saffron rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-1.5 h-1.5 bg-saffron rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-1.5 h-1.5 bg-saffron rounded-full animate-bounce"></div>
        </div>
      </div>
      
      {/* Subtle background Mandala */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center opacity-5">
        <svg width="300" height="300" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="90" fill="none" stroke="#D4760A" strokeWidth="0.5"/>
          <circle cx="100" cy="100" r="70" fill="none" stroke="#D4760A" strokeWidth="0.5"/>
          {Array.from({length:12}).map((_,i)=>(
            <line key={i} x1="100" y1="100" x2={100+90*Math.cos(i*30*Math.PI/180)} y2={100+90*Math.sin(i*30*Math.PI/180)} stroke="#D4760A" strokeWidth="0.2"/>
          ))}
        </svg>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-vedic-bg/80 backdrop-blur-sm">
        {loaderContent}
      </div>
    );
  }

  return (
    <div className="w-full flex items-center justify-center min-h-[300px]">
      {loaderContent}
    </div>
  );
};

export default VedicLoader;
