import React from 'react';
import { Calendar, Building2, CheckCircle2, Scale, CreditCard, Users } from 'lucide-react';
import FloatingAgriCard from './FloatingAgriCard';

/**
 * AgriculturalNetworkBackground
 * Layered ambient background system featuring:
 * 1. Micro-dotted agricultural field matrix (CSS radial-gradient)
 * 2. Subtle SVG contour lines & network nodes (representing procurement supply chain)
 * 3. Staggered floating tactile status cards placed strategically around hero content
 */
export const AgriculturalNetworkBackground = () => {
  // Cards configuration depicting procurement pipeline
  const cards = [
    {
      id: 'booking',
      icon: Calendar,
      title: 'SLOT BOOKING',
      badgeText: 'CONFIRMED',
      badgeBg: 'bg-emerald-100',
      badgeTextCol: 'text-emerald-800',
      subtitle: 'Wheat (PBW-550) · 42 qtl',
      stat: 'Slot #24',
      statLabel: 'Tomorrow 09:30 AM',
      position: 'top-[8%] left-[2%] lg:left-[5%]',
      animationClass: 'animate-agri-float-1 hidden sm:block',
    },
    {
      id: 'centre',
      icon: Building2,
      title: 'CENTRE STATUS',
      badgeText: 'ONLINE',
      badgeBg: 'bg-blue-100',
      badgeTextCol: 'text-blue-800',
      subtitle: 'APMC Mandi Yard #4',
      stat: 'Next Token: #18',
      statLabel: 'Gate 2 Open',
      position: 'top-[12%] right-[2%] lg:right-[5%]',
      animationClass: 'animate-agri-float-2 hidden sm:block',
    },
    {
      id: 'quality',
      icon: CheckCircle2,
      title: 'ASSAYING & QC',
      badgeText: 'GRADE-A',
      badgeBg: 'bg-emerald-100',
      badgeTextCol: 'text-emerald-800',
      subtitle: 'Moisture: 11.8% · Foreign: 0.4%',
      stat: 'Pass Rate 98.4%',
      statLabel: 'Standard Met',
      position: 'top-[52%] left-[1%] lg:left-[4%]',
      animationClass: 'animate-agri-float-3 hidden md:block',
    },
    {
      id: 'payment',
      icon: CreditCard,
      title: 'DBT SETTLEMENT',
      badgeText: 'PROCESSED',
      badgeBg: 'bg-amber-100',
      badgeTextCol: 'text-amber-800',
      subtitle: 'Direct Bank Transfer',
      stat: '₹95,550',
      statLabel: 'Aadhaar Linked',
      position: 'top-[56%] right-[1%] lg:right-[4%]',
      animationClass: 'animate-agri-float-1 hidden md:block',
    },
    {
      id: 'queue',
      icon: Users,
      title: 'LIVE QUEUE',
      badgeText: 'SMOOTH',
      badgeBg: 'bg-emerald-100',
      badgeTextCol: 'text-emerald-800',
      subtitle: '3 Farmers ahead in lane',
      stat: '~12 min wait',
      statLabel: 'Weighbridge Active',
      position: 'bottom-[4%] left-[15%] lg:left-[18%]',
      animationClass: 'animate-agri-float-2 hidden lg:block',
    },
    {
      id: 'weighment',
      icon: Scale,
      title: 'DIGITAL SCALE',
      badgeText: 'CALIBRATED',
      badgeBg: 'bg-purple-100',
      badgeTextCol: 'text-purple-800',
      subtitle: 'Gross: 4,820 kg · Tare: 620 kg',
      stat: 'Net: 42.00 qtl',
      statLabel: 'Tolerance: 0.0%',
      position: 'bottom-[8%] right-[15%] lg:right-[18%]',
      animationClass: 'animate-agri-float-3 hidden lg:block',
    }
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
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
        className="absolute inset-0 w-full h-full opacity-[0.06] text-forest-green"
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
        <line x1="150" y1="180" x2="180" y2="460" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" opacity="0.5" />
        <line x1="1050" y1="190" x2="1020" y2="480" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" opacity="0.5" />
      </svg>

      {/* Layer 3: Floating Tactical Procurement Status Cards */}
      <div className="absolute inset-0 max-w-7xl mx-auto px-4 pointer-events-none">
        {cards.map((card) => (
          <div key={card.id} className={`absolute ${card.position} ${card.animationClass}`}>
            <FloatingAgriCard
              icon={card.icon}
              title={card.title}
              badgeText={card.badgeText}
              badgeBg={card.badgeBg}
              badgeTextCol={card.badgeTextCol}
              subtitle={card.subtitle}
              stat={card.stat}
              statLabel={card.statLabel}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgriculturalNetworkBackground;
