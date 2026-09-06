import React from 'react';

/**
 * AgriculturalVisualBackground
 * 
 * Unified Site-Wide Atmospheric Background System (Round 17):
 * Context-aware agricultural visual atmosphere for AgriNexus:
 * - variant="farm": Gentle Indian farmer & harvested wheat imagery along outer edge, soft ivory blend (Farmer Dashboard, Profile, Bookings)
 * - variant="procurement": Muted procurement centre facility & burlap bags along outer edge, soft ivory blend (Centre Staff Dashboard, Live Queue, Workspace)
 * - variant="district": Faint administrative district topographic lines, geometric field matrix, authoritative data-first presentation (District Command Centre)
 * - variant="journey": Subtle combination of field contours, wheat motifs, and gentle botanical accents (Procurement Lifecycle, Step Pages)
 * - variant="neutral": Pure warm ivory base, ultra-subtle dot grid, faint topographic contours, zero heavy photography (Login, Signup, Access, Dense Forms)
 * 
 * Principles:
 * - Hierarchy: CONTENT > UI > ATMOSPHERE > DECORATION
 * - Never obscures text, tables, forms, or tokens
 * - Responsive opacity & positioning: Subdued on tablet, graceful veil on mobile
 * - Lightweight, performant, language-independent (zero baked-in text)
 * - Accessible: aria-hidden="true", pointer-events-none, role="presentation"
 */
export const AgriculturalVisualBackground = ({
  variant = 'neutral', // 'farm' | 'procurement' | 'district' | 'journey' | 'neutral'
  intensity = 'normal', // 'subtle' | 'normal' | 'soft'
  position = 'both', // 'left' | 'right' | 'both'
  showBotanicalFrame = false,
  showContours = true,
  className = ''
}) => {
  // Determine opacity scales based on intensity prop
  const getPhotoOpacity = () => {
    switch (intensity) {
      case 'subtle':
        return 'opacity-20 sm:opacity-40 md:opacity-50';
      case 'soft':
        return 'opacity-25 sm:opacity-50 md:opacity-65';
      case 'normal':
      default:
        return 'opacity-30 sm:opacity-65 md:opacity-75';
    }
  };

  return (
    <div 
      className={`absolute inset-0 pointer-events-none overflow-hidden select-none z-0 ${className}`} 
      aria-hidden="true"
      role="presentation"
    >
      {/* LAYER 1: Warm Ivory Base (#FAF8F5) */}
      <div className="absolute inset-0 bg-[#FAF8F5]" />

      {/* LAYER 2: Ultra-Subtle Paper Grain & Field Dot Matrix */}
      <div 
        className="absolute inset-0 opacity-[0.022]"
        style={{
          backgroundImage: 'radial-gradient(#22252A 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* LAYER 3: Soft Topographic Contours / Supply Chain Contours */}
      {showContours && (
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.035] text-forest-green"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 1440 900"
        >
          <defs>
            <linearGradient id="visBgContourGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1B4D3E" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#D4A373" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#1B4D3E" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          <path
            d="M-100,240 C320,140 580,310 880,210 C1140,120 1320,260 1540,180"
            fill="none"
            stroke="url(#visBgContourGrad)"
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
          {variant === 'district' && (
            <path
              d="M-50,780 C300,700 650,830 1000,730 C1250,670 1380,760 1500,720"
              fill="none"
              stroke="url(#visBgContourGrad)"
              strokeWidth="1.2"
              strokeDasharray="5 7"
              opacity="0.4"
            />
          )}
        </svg>
      )}

      {/* LAYER 4: CONTEXTUAL PHOTOGRAPHY */}
      {/* MODE A: FARM (Farmer holding harvested wheat along outer left/right edge) */}
      {variant === 'farm' && (
        <div 
          className={`absolute top-0 bottom-0 ${position === 'right' ? 'right-0' : 'left-0'} w-[28%] sm:w-[24%] md:w-[20%] lg:w-[18%] overflow-hidden ${getPhotoOpacity()} transition-opacity duration-300`}
        >
          <div 
            className="absolute inset-0 bg-cover bg-no-repeat bg-[position:left_center] sm:bg-[position:center_20%]"
            style={{
              backgroundImage: 'url(/images/hero/farmer_harvest.jpg)',
            }}
          />
          <div 
            className="absolute inset-0"
            style={{
              background: position === 'right'
                ? 'linear-gradient(to left, rgba(250,248,245,0) 0%, rgba(250,248,245,0.4) 40%, rgba(250,248,245,0.95) 85%, rgba(250,248,245,1) 100%)'
                : 'linear-gradient(to right, rgba(250,248,245,0) 0%, rgba(250,248,245,0.4) 40%, rgba(250,248,245,0.95) 85%, rgba(250,248,245,1) 100%)'
            }}
          />
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, rgba(250,248,245,0.9) 0%, rgba(250,248,245,0) 25%, rgba(250,248,245,0) 70%, rgba(250,248,245,0.95) 100%)'
            }}
          />
        </div>
      )}

      {/* MODE B: PROCUREMENT (Procurement centre facility along outer right/left edge) */}
      {variant === 'procurement' && (
        <div 
          className={`absolute top-0 bottom-0 ${position === 'left' ? 'left-0' : 'right-0'} w-[28%] sm:w-[24%] md:w-[20%] lg:w-[18%] overflow-hidden ${getPhotoOpacity()} transition-opacity duration-300`}
        >
          <div 
            className="absolute inset-0 bg-cover bg-no-repeat bg-[position:right_center] sm:bg-[position:center_30%]"
            style={{
              backgroundImage: 'url(/images/hero/procurement_facility.jpg)',
            }}
          />
          <div 
            className="absolute inset-0"
            style={{
              background: position === 'left'
                ? 'linear-gradient(to right, rgba(250,248,245,0) 0%, rgba(250,248,245,0.4) 40%, rgba(250,248,245,0.95) 85%, rgba(250,248,245,1) 100%)'
                : 'linear-gradient(to left, rgba(250,248,245,0) 0%, rgba(250,248,245,0.4) 40%, rgba(250,248,245,0.95) 85%, rgba(250,248,245,1) 100%)'
            }}
          />
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, rgba(250,248,245,0.9) 0%, rgba(250,248,245,0) 25%, rgba(250,248,245,0) 70%, rgba(250,248,245,0.95) 100%)'
            }}
          />
        </div>
      )}

      {/* MODE D: JOURNEY (Both images anchored at very subtle opacity on far outer borders) */}
      {variant === 'journey' && (
        <>
          {/* Left: subtle farmer hint */}
          <div className="absolute top-0 bottom-0 left-0 w-[18%] sm:w-[15%] overflow-hidden opacity-20 sm:opacity-40 transition-opacity">
            <div 
              className="absolute inset-0 bg-cover bg-no-repeat bg-[position:left_center]"
              style={{ backgroundImage: 'url(/images/hero/farmer_harvest.jpg)' }}
            />
            <div 
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to right, rgba(250,248,245,0) 0%, rgba(250,248,245,0.85) 75%, #FAF8F5 100%)' }}
            />
          </div>
          {/* Right: subtle mandi hint */}
          <div className="absolute top-0 bottom-0 right-0 w-[18%] sm:w-[15%] overflow-hidden opacity-20 sm:opacity-40 transition-opacity">
            <div 
              className="absolute inset-0 bg-cover bg-no-repeat bg-[position:right_center]"
              style={{ backgroundImage: 'url(/images/hero/procurement_facility.jpg)' }}
            />
            <div 
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to left, rgba(250,248,245,0) 0%, rgba(250,248,245,0.85) 75%, #FAF8F5 100%)' }}
            />
          </div>
        </>
      )}

      {/* LAYER 5: Central Negative Space Protection Mask */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 75% 85% at 50% 50%, rgba(250,248,245,0.99) 0%, rgba(250,248,245,0.92) 55%, rgba(250,248,245,0.5) 85%, rgba(250,248,245,0) 100%)'
        }}
      />

      {/* Mobile Veil to ensure 100% typography contrast on compact viewports */}
      <div className="sm:hidden absolute inset-0 bg-[#FAF8F5]/70 pointer-events-none" />

      {/* LAYER 6: Botanical Framing (Optional subtle leaf & stalk accents) */}
      {showBotanicalFrame && (
        <>
          <div className="absolute -bottom-6 -left-6 w-32 sm:w-44 md:w-56 h-32 sm:h-44 md:h-56 pointer-events-none opacity-25 sm:opacity-40">
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-forest-green">
              <path d="M10,195 C40,150 70,120 110,80 C135,55 160,40 185,25" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.6" />
              <path d="M50,140 C80,130 110,110 135,75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
              <path d="M110,80 C120,65 140,65 150,75 C140,90 120,90 110,80 Z" fill="#D4A373" opacity="0.45" />
              <path d="M85,105 C75,90 85,75 100,78 C105,92 98,102 85,105 Z" fill="#1B4D3E" opacity="0.4" />
              <path d="M135,60 C145,45 165,45 175,55 C165,70 145,70 135,60 Z" fill="#D4A373" opacity="0.45" />
            </svg>
          </div>
          <div className="absolute -bottom-8 -right-8 w-32 sm:w-44 md:w-56 h-32 sm:h-44 md:h-56 pointer-events-none opacity-20 sm:opacity-35">
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-forest-green">
              <path d="M190,195 C160,145 130,115 90,75 C65,50 40,35 15,20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.55" />
              <path d="M140,135 C110,125 80,105 55,70" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
              <path d="M90,75 C80,60 60,60 50,70 C60,85 80,85 90,75 Z" fill="#D4A373" opacity="0.45" />
              <path d="M115,100 C125,85 115,70 100,73 C95,87 102,97 115,100 Z" fill="#1B4D3E" opacity="0.4" />
            </svg>
          </div>
        </>
      )}
    </div>
  );
};

export default AgriculturalVisualBackground;
