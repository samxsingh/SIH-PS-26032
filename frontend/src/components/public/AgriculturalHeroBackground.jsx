import React from 'react';

/**
 * AgriculturalHeroBackground
 * 
 * Round 16 Visual Reconstruction:
 * Multi-layer responsive agricultural hero composition:
 * - Layer 1: Warm ivory base (#FAF8F5)
 * - Layer 2: Ultra-subtle paper grain / dot matrix texture
 * - Layer 3: Soft topographical agricultural contour lines (faint golden wheat & sage)
 * - Layer 4: LEFT side — Authentic Indian farmer with harvested wheat crop in natural morning light
 * - Layer 5: RIGHT side — Real procurement centre / mandi facility with grain stacks, weighbridge, & transport truck
 * - Layer 6: Multi-directional radial & linear atmospheric ivory gradients preserving central negative space
 * - Layer 7: Botanical leaf & wheat stalk vector accents framing the bottom-left and bottom-right edges
 * - Layer 8: Clean bottom transition smoothly merging with the workflow section
 * 
 * Guaranteed:
 * - Desktop: Farmer occupies outer ~24-28% left; Procurement centre occupies outer ~24-28% right.
 * - Center 40%-60% remains completely calm, clean, high-contrast ivory space.
 * - Mobile / Tablet: Imagery is gracefully pushed to outer edges with enhanced opacity fade so text is 100% legible without shadows.
 * - Never overlaps hero text in English or Hindi.
 * - Full responsive adaptation across 375px - 1920px+ viewports.
 * - Accessible: Marked aria-hidden="true", pointer-events-none, role="presentation".
 */
export const AgriculturalHeroBackground = () => {
  return (
    <div 
      className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0" 
      aria-hidden="true"
      role="presentation"
    >
      {/* LAYER 1: Warm Ivory Base (matches #FAF8F5 palette) */}
      <div className="absolute inset-0 bg-[#FAF8F5]" />

      {/* LAYER 2: Ultra-Subtle Paper Grain & Field Matrix */}
      <div 
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'radial-gradient(#22252A 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* LAYER 3: Soft Topographic Contours (Subtle Agricultural Field Elevation) */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.04] text-forest-green"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        viewBox="0 0 1440 900"
      >
        <defs>
          <linearGradient id="heroContourGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1B4D3E" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#D4A373" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#1B4D3E" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        <path
          d="M-100,240 C320,140 580,310 880,210 C1140,120 1320,260 1540,180"
          fill="none"
          stroke="url(#heroContourGrad)"
          strokeWidth="1.5"
          strokeDasharray="4 6"
        />
        <path
          d="M-100,520 C240,580 560,440 920,530 C1180,600 1340,480 1540,550"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeDasharray="6 8"
          opacity="0.6"
        />
      </svg>

      {/* LAYER 4: LEFT SIDE — Real Farmer with Harvested Wheat Crop */}
      {/* On desktop: Occupies outer ~28% width; on mobile/tablet: smaller scale, pinned to edge, subdued opacity */}
      <div 
        className="absolute top-0 bottom-0 left-0 w-[30%] sm:w-[28%] md:w-[26%] lg:w-[25%] xl:w-[24%] overflow-hidden opacity-30 sm:opacity-75 md:opacity-90 transition-opacity duration-300"
      >
        <div 
          className="absolute inset-0 bg-cover bg-no-repeat bg-[position:left_center] sm:bg-[position:center_20%]"
          style={{
            backgroundImage: 'url(/images/hero/farmer_harvest.jpg)',
          }}
        />
        {/* Soft edge blend into central ivory - Horizontal gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to right, rgba(250,248,245,0) 0%, rgba(250,248,245,0.15) 35%, rgba(250,248,245,0.7) 70%, rgba(250,248,245,1) 100%)'
          }}
        />
        {/* Top/Bottom ambient fade */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(250,248,245,0.85) 0%, rgba(250,248,245,0) 20%, rgba(250,248,245,0) 75%, rgba(250,248,245,0.95) 100%)'
          }}
        />
      </div>

      {/* LAYER 5: RIGHT SIDE — Real Procurement Centre / Grain Mandi Facility */}
      {/* On desktop: Occupies outer ~28% width; on mobile/tablet: smaller scale, pinned to edge, subdued opacity */}
      <div 
        className="absolute top-0 bottom-0 right-0 w-[30%] sm:w-[28%] md:w-[26%] lg:w-[25%] xl:w-[24%] overflow-hidden opacity-30 sm:opacity-75 md:opacity-85 transition-opacity duration-300"
      >
        <div 
          className="absolute inset-0 bg-cover bg-no-repeat bg-[position:right_center] sm:bg-[position:center_30%]"
          style={{
            backgroundImage: 'url(/images/hero/procurement_facility.jpg)',
          }}
        />
        {/* Soft edge blend into central ivory - Horizontal gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to left, rgba(250,248,245,0) 0%, rgba(250,248,245,0.15) 35%, rgba(250,248,245,0.7) 70%, rgba(250,248,245,1) 100%)'
          }}
        />
        {/* Top/Bottom ambient fade */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(250,248,245,0.85) 0%, rgba(250,248,245,0) 20%, rgba(250,248,245,0) 75%, rgba(250,248,245,0.95) 100%)'
          }}
        />
      </div>

      {/* LAYER 6: Central Negative Space Protection (Ivory Radial & Linear Mask) */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 70% 85% at 50% 45%, rgba(250,248,245,0.99) 0%, rgba(250,248,245,0.94) 45%, rgba(250,248,245,0.4) 75%, rgba(250,248,245,0) 100%)'
        }}
      />

      {/* Mobile-only additional ivory veil to ensure 100% pristine contrast on small screens */}
      <div 
        className="sm:hidden absolute inset-0 bg-[#FAF8F5]/65 pointer-events-none" 
      />

      {/* LAYER 7: Botanical Edge Accents (Subtle Organic Framing - Leaves & Stalks) */}
      {/* Bottom-Left Botanical Accent */}
      <div className="absolute -bottom-6 -left-6 w-36 sm:w-52 md:w-64 h-36 sm:h-52 md:h-64 pointer-events-none opacity-30 sm:opacity-45 md:opacity-60">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-forest-green">
          {/* Main botanical stem */}
          <path d="M10,195 C40,150 70,120 110,80 C135,55 160,40 185,25" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.6" />
          {/* Secondary branch */}
          <path d="M50,140 C80,130 110,110 135,75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          
          {/* Wheat kernel / leaf 1 */}
          <path d="M110,80 C120,65 140,65 150,75 C140,90 120,90 110,80 Z" fill="#D4A373" opacity="0.45" />
          {/* Leaf 2 */}
          <path d="M85,105 C75,90 85,75 100,78 C105,92 98,102 85,105 Z" fill="#1B4D3E" opacity="0.4" />
          {/* Leaf 3 */}
          <path d="M135,60 C145,45 165,45 175,55 C165,70 145,70 135,60 Z" fill="#D4A373" opacity="0.45" />
          {/* Leaf 4 */}
          <path d="M60,132 C48,122 55,108 70,112 C74,124 68,131 60,132 Z" fill="#1B4D3E" opacity="0.35" />
          {/* Terminal wheat head */}
          <path d="M185,25 C192,15 198,18 195,28 C190,35 183,32 185,25 Z" fill="#D4A373" opacity="0.5" />
        </svg>
      </div>

      {/* Bottom-Right Botanical Accent (Asymmetric Composition) */}
      <div className="absolute -bottom-8 -right-8 w-36 sm:w-52 md:w-64 h-36 sm:h-52 md:h-64 pointer-events-none opacity-25 sm:opacity-40 md:opacity-55">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-forest-green">
          {/* Main botanical stalk */}
          <path d="M190,195 C160,145 130,115 90,75 C65,50 40,35 15,20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.55" />
          {/* Offshoot branch */}
          <path d="M140,135 C110,125 80,105 55,70" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />

          {/* Leaf / Husk 1 */}
          <path d="M90,75 C80,60 60,60 50,70 C60,85 80,85 90,75 Z" fill="#D4A373" opacity="0.45" />
          {/* Leaf 2 */}
          <path d="M115,100 C125,85 115,70 100,73 C95,87 102,97 115,100 Z" fill="#1B4D3E" opacity="0.4" />
          {/* Leaf 3 */}
          <path d="M65,55 C55,40 35,40 25,50 C35,65 55,65 65,55 Z" fill="#D4A373" opacity="0.45" />
          {/* Leaf 4 */}
          <path d="M140,128 C152,118 145,104 130,108 C126,120 132,127 140,128 Z" fill="#1B4D3E" opacity="0.35" />
          {/* Stalk end */}
          <path d="M15,20 C8,10 2,13 5,23 C10,30 17,27 15,20 Z" fill="#D4A373" opacity="0.5" />
        </svg>
      </div>

      {/* LAYER 8: Clean Bottom Transition (Smooth blend to the next section) */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, #FAF8F5 0%, rgba(250,248,245,0) 100%)'
        }}
      />
    </div>
  );
};

export default AgriculturalHeroBackground;
