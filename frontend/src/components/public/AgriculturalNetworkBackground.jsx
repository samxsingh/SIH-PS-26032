import React from 'react';

/**
 * AgriculturalNetworkBackground
 * Layered ambient background visual for the AgriNexus hero section:
 * 1. Micro-dotted agricultural field matrix (CSS radial-gradient)
 * 2. Subtle SVG contour lines & network nodes (representing mandi supply chain)
 * Purely decorative; marked aria-hidden="true".
 */
export const AgriculturalNetworkBackground = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0" aria-hidden="true">
      {/* Layer 1: Dot Matrix Grid */}
      <div 
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: 'radial-gradient(#22252A 1.25px, transparent 1.25px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Layer 2: Ambient SVG Network & Contours */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.05] text-forest-green"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        viewBox="0 0 1200 800"
      >
        <defs>
          <linearGradient id="agriLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#D4A373" stopOpacity="0.4" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Topographic field contour 1 */}
        <path
          d="M-50,200 C250,120 450,280 750,180 C950,100 1100,240 1250,160"
          fill="none"
          stroke="url(#agriLineGrad)"
          strokeWidth="1.5"
          strokeDasharray="4 6"
          className="animate-pulse-slow"
        />

        {/* Topographic field contour 2 */}
        <path
          d="M-50,450 C200,520 500,380 800,480 C1000,540 1150,420 1250,500"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeDasharray="6 8"
          opacity="0.7"
        />

        {/* Topographic field contour 3 */}
        <path
          d="M-50,700 C300,620 600,740 900,660 C1050,620 1150,710 1250,680"
          fill="none"
          stroke="url(#agriLineGrad)"
          strokeWidth="1.5"
          strokeDasharray="3 5"
        />

        {/* Network connections between key procurement nodes */}
        {/* Node 1: Left Top */}
        <circle cx="150" cy="180" r="4" fill="currentColor" />
        <circle cx="150" cy="180" r="10" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4" />
        
        {/* Node 2: Right Top */}
        <circle cx="1050" cy="190" r="4" fill="currentColor" />
        <circle cx="1050" cy="190" r="10" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4" />

        {/* Node 3: Mid-Left */}
        <circle cx="180" cy="460" r="4" fill="currentColor" />
        <circle cx="180" cy="460" r="8" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4" />

        {/* Node 4: Mid-Right */}
        <circle cx="1020" cy="480" r="4" fill="currentColor" />
        <circle cx="1020" cy="480" r="8" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4" />

        {/* Cross connecting faint vectors */}
        <line x1="150" y1="180" x2="180" y2="460" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" opacity="0.4" />
        <line x1="1050" y1="190" x2="1020" y2="480" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" opacity="0.4" />
      </svg>
    </div>
  );
};

export default AgriculturalNetworkBackground;
