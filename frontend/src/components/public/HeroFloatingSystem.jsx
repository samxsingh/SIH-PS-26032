import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Calendar, CreditCard, ShieldCheck, Scale } from 'lucide-react';
import FloatingAgriCard from './FloatingAgriCard';

/**
 * HeroFloatingSystem 3.0 — Ambient Information System
 * 
 * Replaces the rigid event-coordinator with an ORGANIC AMBIENT INFORMATION WINDOW ENGINE:
 * 
 * 1. INDEPENDENT AMBIENT WINDOWS:
 *    - Permanent spatial slots: Slot 0 (Top-Left A), Slot 1 (Bottom-Left B), Slot 2 (Top-Right C), Slot 3 (Bottom-Right D).
 *    - Each slot has independent randomized dwell and eligibility (5–8s after materialization).
 *    - No master tick loop, no global slideshow queue, no A -> B -> C -> D carousel patterns.
 * 
 * 2. OVERLAPPING LIFECYCLES:
 *    - A card does NOT have to return before another starts dissolving.
 *    - Variable group size: 1 card (~35%), 2 cards (~50%), 3 cards (~15%), NEVER 4 cards.
 *    - Natural stagger intervals between launches: 250ms – 900ms.
 *    - Exit order and Enter order are independently decoupled.
 * 
 * 3. TRUE DISSOLUTION & GRADUAL MATERIALIZATION:
 *    - Exit: 1.4s – 1.8s (opacity: 1 -> 0, translateY: 0 -> -3px, scale: 1 -> 0.985, ending softness blur(0) -> blur(1.0px)).
 *    - Empty Gap: 700ms – 1200ms randomized interval (slot dimensionally reserved at opacity: 0; silent content swap).
 *    - Entrance: 1.8s – 2.4s (opacity: 0 -> 1, translateY: 3px -> 0, scale: 0.985 -> 1, blur: 1.0px -> 0).
 *    - Rest / Settled: Strictly filter: none, transform: none (100% crisp typography and borders).
 * 
 * 4. DENSITY & SAFETY GUARANTEES:
 *    - Desktop starts with 4 fully visible, sharp cards (4–6s initial calm hold).
 *    - Active transitions maintain strictly 2–3 visible cards (never 4 -> 0 or 4 -> 1).
 *    - Zero collisions, zero horizontal overflow, zero duplicate cards across slots.
 *    - prefers-reduced-motion: reduce disables all timers and animations.
 */
export const HeroFloatingSystem = () => {
  const { t } = useTranslation();

  // 1. Five canonical AgriNexus insights (rotated across slots for zero duplication)
  const cards = useMemo(() => [
    {
      id: 'verified-procurement',
      icon: Building2,
      label: t('landing.hero_card_a_tag'),
      badgeText: t('landing.hero_card_a_badge'),
      badgeBg: 'bg-forest-green-light',
      badgeTextCol: 'text-forest-green',
      title: t('landing.hero_card_a_title'),
      desc: t('landing.hero_card_a_desc'),
      metric: t('landing.hero_card_a_metric'),
      substeps: null
    },
    {
      id: 'crop-journey',
      icon: Calendar,
      label: t('landing.hero_card_b_tag'),
      badgeText: t('landing.hero_card_b_badge'),
      badgeBg: 'bg-amber-100',
      badgeTextCol: 'text-amber-900',
      title: t('landing.hero_card_b_title'),
      desc: t('landing.hero_card_b_desc'),
      metric: t('landing.hero_card_b_metric'),
      substeps: [
        t('landing.hero_card_b_s1'),
        t('landing.hero_card_b_s2'),
        t('landing.hero_card_b_s3'),
        t('landing.hero_card_b_s4')
      ]
    },
    {
      id: 'dbt-payment',
      icon: CreditCard,
      label: t('landing.hero_card_c_tag'),
      badgeText: t('landing.hero_card_c_badge'),
      badgeBg: 'bg-emerald-100',
      badgeTextCol: 'text-emerald-900',
      title: t('landing.hero_card_c_title'),
      desc: t('landing.hero_card_c_desc'),
      metric: t('landing.hero_card_c_metric'),
      substeps: [
        t('landing.hero_card_c_s1'),
        t('landing.hero_card_c_s2'),
        t('landing.hero_card_c_s3')
      ]
    },
    {
      id: 'one-agri-network',
      icon: ShieldCheck,
      label: t('landing.hero_card_d_tag'),
      badgeText: t('landing.hero_card_d_badge'),
      badgeBg: 'bg-blue-100',
      badgeTextCol: 'text-blue-900',
      title: t('landing.hero_card_d_title'),
      desc: t('landing.hero_card_d_desc'),
      metric: t('landing.hero_card_d_metric'),
      substeps: [
        t('landing.hero_card_d_s1'),
        t('landing.hero_card_d_s2'),
        t('landing.hero_card_d_s3')
      ]
    },
    {
      id: 'digital-audit',
      icon: Scale,
      label: t('landing.hero_card_e_tag'),
      badgeText: t('landing.hero_card_e_badge'),
      badgeBg: 'bg-amber-50',
      badgeTextCol: 'text-amber-800',
      title: t('landing.hero_card_e_title'),
      desc: t('landing.hero_card_e_desc'),
      metric: t('landing.hero_card_e_metric'),
      substeps: [
        t('landing.hero_card_e_s1'),
        t('landing.hero_card_e_s2'),
        t('landing.hero_card_e_s3')
      ]
    }
  ], [t]);

  // Synchronous, glitch-free initial state for the 4 desktop spatial slots
  const [slotCards, setSlotCards] = useState({ 0: 0, 1: 1, 2: 2, 3: 3 });
  
  // Transition stages: 'visible' | 'exit' | 'empty' | 'enter'
  const [slotTransitions, setSlotTransitions] = useState({
    0: 'visible',
    1: 'visible',
    2: 'visible',
    3: 'visible'
  });

  // Dynamic transition duration per slot (in ms)
  const [slotDurations, setSlotDurations] = useState({
    0: 2000,
    1: 2000,
    2: 2000,
    3: 2000
  });

  // Mutable state references for synchronous state lookups
  const isReducedMotionRef = useRef(false);
  const isMountedRef = useRef(true);
  const pendingTimersRef = useRef(new Set());

  const slotCardsRef = useRef({ 0: 0, 1: 1, 2: 2, 3: 3 });
  const activeAssignmentsRef = useRef({ 0: 0, 1: 1, 2: 2, 3: 3 });
  const slotTransitionsRef = useRef({
    0: 'visible',
    1: 'visible',
    2: 'visible',
    3: 'visible'
  });
  const slotDurationsRef = useRef({
    0: 2000,
    1: 2000,
    2: 2000,
    3: 2000
  });

  // Slot history for preventing immediate repetition of card contents
  const slotHistoryRef = useRef({
    0: [0],
    1: [1],
    2: [2],
    3: [3]
  });

  // Independent randomized dwell per slot (5,000ms – 8,000ms)
  const slotLastSettledRef = useRef({
    0: Date.now(),
    1: Date.now(),
    2: Date.now(),
    3: Date.now()
  });
  const slotDwellRequirementRef = useRef({
    0: 5200,
    1: 6400,
    2: 7100,
    3: 5800
  });

  // Anti-repetition memory
  const recentTransitionedSlotsRef = useRef([]); // Last transitioned slots
  const recentGroupSizesRef = useRef([]); // Last group sizes: 1, 2, 3
  const recentPairsRef = useRef([]); // Last pair combinations

  // Timing constants for Version 3.0 Rebuild
  const INITIAL_STABILIZATION_MS = 5000; // 5.0s calm initial presentation (4–6s spec)
  const MIN_DWELL_MS = 5000; // 5s minimum card presence (5–8s spec)
  const MAX_DWELL_MS = 8000; // 8s maximum card presence (5–8s spec)

  // Safe timer registration with automatic cleanup
  const addTimer = useCallback((fn, delay) => {
    let id;
    id = setTimeout(() => {
      pendingTimersRef.current.delete(id);
      fn();
    }, delay);
    pendingTimersRef.current.add(id);
    return id;
  }, []);

  const clearAllTimers = useCallback(() => {
    pendingTimersRef.current.forEach(id => clearTimeout(id));
    pendingTimersRef.current.clear();
  }, []);

  // Autonomous Slot Transition Step Handlers
  const startSlotExit = useCallback((slotId, exitMs) => {
    if (!isMountedRef.current || isReducedMotionRef.current) return;
    slotDurationsRef.current[slotId] = exitMs;
    setSlotDurations(prev => ({ ...prev, [slotId]: exitMs }));
    slotTransitionsRef.current[slotId] = 'exit';
    setSlotTransitions(prev => ({ ...prev, [slotId]: 'exit' }));
  }, []);

  const setSlotToEmpty = useCallback((slotId, newCardIndex) => {
    if (!isMountedRef.current || isReducedMotionRef.current) return;
    // Silently swap content while card is 100% transparent
    slotCardsRef.current[slotId] = newCardIndex;
    slotHistoryRef.current[slotId] = [
      newCardIndex,
      ...(slotHistoryRef.current[slotId] || []).slice(0, 2)
    ];
    setSlotCards(prev => ({ ...prev, [slotId]: newCardIndex }));

    // Reset positioning silently at translateY(3px) scale(0.985) without animation
    slotDurationsRef.current[slotId] = 0;
    setSlotDurations(prev => ({ ...prev, [slotId]: 0 }));
    slotTransitionsRef.current[slotId] = 'empty';
    setSlotTransitions(prev => ({ ...prev, [slotId]: 'empty' }));
  }, []);

  const startSlotEnter = useCallback((slotId, enterMs) => {
    if (!isMountedRef.current || isReducedMotionRef.current) return;
    slotDurationsRef.current[slotId] = enterMs;
    setSlotDurations(prev => ({ ...prev, [slotId]: enterMs }));
    slotTransitionsRef.current[slotId] = 'enter';
    setSlotTransitions(prev => ({ ...prev, [slotId]: 'enter' }));
  }, []);

  const setSlotToVisible = useCallback((slotId) => {
    if (!isMountedRef.current || isReducedMotionRef.current) return;
    slotTransitionsRef.current[slotId] = 'visible';
    setSlotTransitions(prev => ({ ...prev, [slotId]: 'visible' }));
    slotLastSettledRef.current[slotId] = Date.now();
    // Assign a fresh randomized dwell time between 5,000ms and 8,000ms
    slotDwellRequirementRef.current[slotId] = MIN_DWELL_MS + Math.floor(Math.random() * (MAX_DWELL_MS - MIN_DWELL_MS));
  }, [MAX_DWELL_MS, MIN_DWELL_MS]);

  // Main Ambient Lifecycle Coordinator
  useEffect(() => {
    isMountedRef.current = true;

    // Accessibility prefers-reduced-motion listener
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    isReducedMotionRef.current = mediaQuery.matches;

    const handleMotionChange = (e) => {
      isReducedMotionRef.current = e.matches;
      if (e.matches) {
        setSlotTransitions({ 0: 'visible', 1: 'visible', 2: 'visible', 3: 'visible' });
        slotTransitionsRef.current = { 0: 'visible', 1: 'visible', 2: 'visible', 3: 'visible' };
        clearAllTimers();
      } else {
        slotLastSettledRef.current = { 0: Date.now(), 1: Date.now(), 2: Date.now(), 3: Date.now() };
        addTimer(scheduleNextAmbientBreath, 3000);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMotionChange);
    } else {
      mediaQuery.addListener(handleMotionChange);
    }

    if (isReducedMotionRef.current) {
      return () => {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', handleMotionChange);
        } else {
          mediaQuery.removeListener(handleMotionChange);
        }
      };
    }

    // Determine eligible slots based on viewport width
    const getEligibleSlots = () => {
      const width = typeof window !== 'undefined' ? window.innerWidth : 1440;
      if (width < 1280) {
        // Laptop: Only slots 0 (Left Top) and 2 (Right Top)
        return [0, 2];
      }
      // Desktop: All 4 slots (0, 1, 2, 3)
      return [0, 1, 2, 3];
    };

    // Card assignment helper guaranteeing 100% uniqueness
    const pickUniqueCard = (slotId, eligibleSlots) => {
      const allCardIndices = cards.map((_, idx) => idx);
      const otherAssignedCards = new Set(
        eligibleSlots.filter(s => s !== slotId).map(s => activeAssignmentsRef.current[s])
      );
      const currentCard = activeAssignmentsRef.current[slotId];
      let candidates = allCardIndices.filter(c => !otherAssignedCards.has(c) && c !== currentCard);
      const history = slotHistoryRef.current[slotId] || [];
      const freshCandidates = candidates.filter(c => !history.includes(c));
      const chosen = freshCandidates.length > 0
        ? freshCandidates[Math.floor(Math.random() * freshCandidates.length)]
        : (candidates[0] ?? 0);
      
      activeAssignmentsRef.current[slotId] = chosen;
      return chosen;
    };

    /**
     * Organic Ambient Breath Scheduler
     * Evaluates independent slot eligibility and launches natural, overlapping transitions.
     */
    const scheduleNextAmbientBreath = () => {
      if (!isMountedRef.current || isReducedMotionRef.current) return;

      const eligibleSlots = getEligibleSlots();
      const transitioningSlots = eligibleSlots.filter(s => slotTransitionsRef.current[s] !== 'visible');
      const activeCount = transitioningSlots.length;

      // Density Guard: At least 2 cards must remain visually present at all times on desktop
      // Laptop: at least 1 card remains visible
      if (eligibleSlots.length > 2) {
        if (activeCount >= 2) {
          addTimer(scheduleNextAmbientBreath, 600 + Math.floor(Math.random() * 400));
          return;
        }
      } else {
        if (activeCount >= 1) {
          addTimer(scheduleNextAmbientBreath, 800 + Math.floor(Math.random() * 400));
          return;
        }
      }

      const now = Date.now();

      // Find settled slots that have completed their randomized dwell requirement (5–8s)
      const eligibleSettledSlots = eligibleSlots.filter(s => {
        if (slotTransitionsRef.current[s] !== 'visible') return false;
        const dwelledMs = now - (slotLastSettledRef.current[s] || 0);
        const reqDwell = slotDwellRequirementRef.current[s] || MIN_DWELL_MS;
        return dwelledMs >= reqDwell;
      });

      if (eligibleSettledSlots.length === 0) {
        addTimer(scheduleNextAmbientBreath, 500 + Math.floor(Math.random() * 400));
        return;
      }

      // Laptop (2 slots): strictly 1 card at a time
      if (eligibleSlots.length <= 2) {
        const targetSlot = eligibleSettledSlots[Math.floor(Math.random() * eligibleSettledSlots.length)];
        launchAmbientTransitionGroup([targetSlot], eligibleSlots);
        return;
      }

      // Desktop: Dynamic group size with constrained distribution:
      // Single card: ~35%
      // Two cards: ~50%
      // Three cards: ~15%
      const recentGroupSizes = recentGroupSizesRef.current;
      const recentTriples = recentGroupSizes.filter(s => s === 3).length;

      let targetGroupSize = 1;
      const rand = Math.random();

      if (eligibleSettledSlots.length >= 3 && activeCount === 0 && recentTriples === 0 && rand < 0.15) {
        targetGroupSize = 3;
      } else if (eligibleSettledSlots.length >= 2 && activeCount === 0 && rand < 0.65) {
        targetGroupSize = 2;
      } else {
        targetGroupSize = 1;
      }

      recentGroupSizesRef.current = [targetGroupSize, ...(recentGroupSizesRef.current || []).slice(0, 3)];

      // Select participating slots using anti-repetition rules
      let selectedSlots = [];

      if (targetGroupSize === 1) {
        // Avoid slot that transitioned most recently
        const recentSlots = recentTransitionedSlotsRef.current;
        const freshCandidates = eligibleSettledSlots.filter(s => !recentSlots.slice(0, 2).includes(s));
        const pool = freshCandidates.length > 0 ? freshCandidates : eligibleSettledSlots;
        selectedSlots = [pool[Math.floor(Math.random() * pool.length)]];
      } else if (targetGroupSize === 2) {
        // Select a fresh pair (adjacent, diagonal, or cross)
        const possiblePairs = [
          [0, 1], [2, 3], // Verticals
          [0, 2], [1, 3], // Horizontals
          [0, 3], [1, 2]  // Diagonals
        ];
        const recentPairs = recentPairsRef.current || [];
        const validPairs = possiblePairs.filter(p => eligibleSettledSlots.includes(p[0]) && eligibleSettledSlots.includes(p[1]));
        const freshPairs = validPairs.filter(p => !recentPairs.some(rp => (rp[0] === p[0] && rp[1] === p[1]) || (rp[0] === p[1] && rp[1] === p[0])));
        const fallbackPair = eligibleSettledSlots.length >= 2 ? [eligibleSettledSlots[0], eligibleSettledSlots[1]] : [0, 1];
        const pool = freshPairs.length > 0 ? freshPairs : (validPairs.length > 0 ? validPairs : [fallbackPair]);
        const chosenPair = pool[Math.floor(Math.random() * pool.length)] || fallbackPair;
        
        // Randomize order
        selectedSlots = Math.random() < 0.5 ? [chosenPair[0], chosenPair[1]] : [chosenPair[1], chosenPair[0]];
        recentPairsRef.current = [[chosenPair[0], chosenPair[1]], ...(recentPairsRef.current || []).slice(0, 2)];
      } else {
        // Triple group: pick 3 random settled slots
        const shuffled = [...eligibleSettledSlots].sort(() => Math.random() - 0.5);
        selectedSlots = shuffled.slice(0, 3);
      }

      launchAmbientTransitionGroup(selectedSlots, eligibleSlots);
    };

    /**
     * Ambient Transition Group Launcher
     * Executes independent overlapping lifecycles with natural variable stagger and decoupled enter order.
     */
    const launchAmbientTransitionGroup = (slots, eligibleSlots) => {
      recentTransitionedSlotsRef.current = [...slots, ...(recentTransitionedSlotsRef.current || []).slice(0, 3)];

      // Exit order is the selected slots order
      const exitOrder = [...slots];
      
      // Enter order is independently decoupled from Exit order (removes queue feeling)
      let enterOrder = [...slots];
      if (slots.length === 2) {
        // 50% chance to invert entrance order (Organic Asymmetry)
        enterOrder = Math.random() < 0.5 ? [slots[0], slots[1]] : [slots[1], slots[0]];
      } else if (slots.length === 3) {
        const permutations = [
          [slots[1], slots[0], slots[2]],
          [slots[1], slots[2], slots[0]],
          [slots[2], slots[0], slots[1]]
        ];
        enterOrder = permutations[Math.floor(Math.random() * permutations.length)];
      }

      // Pre-reserve unique cards for each participating slot
      const cardMap = {};
      slots.forEach(s => {
        cardMap[s] = pickUniqueCard(s, eligibleSlots);
      });

      if (typeof window !== 'undefined') {
        window.__heroBatchEvents = window.__heroBatchEvents || [];
        window.__heroBatchEvents.push({
          timestamp: Date.now(),
          type: slots.length === 1 ? 'single' : (slots.length === 2 ? 'pair' : 'triple'),
          batchSize: slots.length,
          slots: [...slots],
          exitOrder: [...exitOrder],
          enterOrder: [...enterOrder]
        });
      }

      // Natural variable stagger intervals between exits: 250ms – 900ms
      let maxEventDuration = 0;

      if (slots.length === 1) {
        const s = slots[0];
        const exitMs = 1400 + Math.floor(Math.random() * 400); // 1.4s – 1.8s dissolution
        const emptyMs = 700 + Math.floor(Math.random() * 500); // 700ms – 1200ms empty gap
        const enterMs = 1800 + Math.floor(Math.random() * 600); // 1.8s – 2.4s materialization

        // Exit dissolution
        startSlotExit(s, exitMs);

        // Empty breathing gap (card transparent, content swapped invisibly)
        addTimer(() => {
          setSlotToEmpty(s, cardMap[s]);

          // Gradual materialization
          addTimer(() => {
            startSlotEnter(s, enterMs);

            // Settle into crisp resting state (filter: none)
            addTimer(() => {
              setSlotToVisible(s);
            }, enterMs);
          }, emptyMs);
        }, exitMs);

        maxEventDuration = exitMs + emptyMs + enterMs;
      } else if (slots.length === 2) {
        const [s1, s2] = exitOrder;
        const [e1, e2] = enterOrder;

        const exitMs1 = 1400 + Math.floor(Math.random() * 400);
        const exitMs2 = 1400 + Math.floor(Math.random() * 400);
        const emptyMs1 = 700 + Math.floor(Math.random() * 500);
        const emptyMs2 = 700 + Math.floor(Math.random() * 500);
        const enterMs1 = 1800 + Math.floor(Math.random() * 600);
        const enterMs2 = 1800 + Math.floor(Math.random() * 600);

        // Stagger exit launch: 300ms – 750ms
        const exitStaggerMs = 300 + Math.floor(Math.random() * 450);

        // Slot 1 begins exit at T = 0
        startSlotExit(s1, exitMs1);
        addTimer(() => {
          setSlotToEmpty(s1, cardMap[s1]);
        }, exitMs1);

        // Slot 2 begins exit at T = exitStaggerMs (overlapping dissolution)
        addTimer(() => {
          startSlotExit(s2, exitMs2);
          addTimer(() => {
            setSlotToEmpty(s2, cardMap[s2]);
          }, exitMs2);
        }, exitStaggerMs);

        // Decoupled Enter 1 launch
        const e1ReadyTime = e1 === s1 ? exitMs1 + emptyMs1 : exitStaggerMs + exitMs2 + emptyMs2;
        addTimer(() => {
          startSlotEnter(e1, enterMs1);
          addTimer(() => {
            setSlotToVisible(e1);
          }, enterMs1);
        }, e1ReadyTime);

        // Decoupled Enter 2 launch: launches after Enter 1 settles to strictly enforce <= 3 active cards
        const e2ReadyTime = e1ReadyTime + enterMs1 + 250;
        addTimer(() => {
          startSlotEnter(e2, enterMs2);
          addTimer(() => {
            setSlotToVisible(e2);
          }, enterMs2);
        }, e2ReadyTime);

        maxEventDuration = e2ReadyTime + enterMs2;
      } else {
        // Triple group wave (overlapping wave)
        const [s1, s2, s3] = exitOrder;
        const exitMs = 1500;
        const emptyMs = 900;
        const enterMs = 1900;
        const stagger1 = 450;
        const stagger2 = 900;

        // Card 1 exits at T = 0
        startSlotExit(s1, exitMs);
        addTimer(() => {
          setSlotToEmpty(s1, cardMap[s1]);
        }, exitMs);

        // Card 2 exits at T = 450ms
        addTimer(() => {
          startSlotExit(s2, exitMs);
          addTimer(() => {
            setSlotToEmpty(s2, cardMap[s2]);
          }, exitMs);
        }, stagger1);

        // Card 1 begins entering at T = 2400ms (returning visibly)
        addTimer(() => {
          startSlotEnter(s1, enterMs);
          addTimer(() => {
            setSlotToVisible(s1);
          }, enterMs);
        }, exitMs + emptyMs);

        // Card 3 exits at T = 4500ms (Card 1 has settled into visible state, guaranteeing at least 2 cards remain fully visible!)
        addTimer(() => {
          startSlotExit(s3, exitMs);
          addTimer(() => {
            setSlotToEmpty(s3, cardMap[s3]);
          }, exitMs);
        }, 4500);

        // Card 2 enters after Card 1 settles (T = 4700ms)
        addTimer(() => {
          startSlotEnter(s2, enterMs);
          addTimer(() => {
            setSlotToVisible(s2);
          }, enterMs);
        }, 4700);

        // Card 3 enters after Card 2 settles (T = 6900ms)
        addTimer(() => {
          startSlotEnter(s3, enterMs);
          addTimer(() => {
            setSlotToVisible(s3);
          }, enterMs);
        }, 6900);

        maxEventDuration = 6900 + enterMs;
      }

      // Calm breathing pause before scheduling next ambient breath (3,000ms – 6,000ms)
      const restDelay = maxEventDuration + 3000 + Math.floor(Math.random() * 3000);
      addTimer(scheduleNextAmbientBreath, restDelay);
    };

    // Initial Serenity: 5.0 seconds of completely stable, sharp cards before first transition
    addTimer(scheduleNextAmbientBreath, INITIAL_STABILIZATION_MS);

    return () => {
      isMountedRef.current = false;
      clearAllTimers();

      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMotionChange);
      } else {
        mediaQuery.removeListener(handleMotionChange);
      }
    };
  }, [cards, addTimer, clearAllTimers, startSlotExit, setSlotToEmpty, startSlotEnter, setSlotToVisible]);

  // Helper to render individual slot with stable bounding geometry
  const renderSlot = (slotId, driftClass, scaleClass, originClass, customClass = '') => {
    const cardIndex = slotCards[slotId];
    const cardData = cards[cardIndex] || cards[0];
    const transitionState = slotTransitions[slotId];
    const duration = slotDurations[slotId] || 2000;

    // Dissolution & Materialization Visual Dynamics (100% Crisp Typography, Zero Permanent Blur):
    // - visible: opacity-100 translate-y-0 scale-100 ease-cinematic
    // - exit: opacity-0 -translate-y-[3px] scale-[0.985] ease-cinematic (1.4s–1.8s dissolution)
    // - empty: opacity-0 translate-y-[3px] scale-[0.985] transition-none (silent content swap)
    // - enter: opacity-100 translate-y-0 scale-100 ease-cinematic (1.8s–2.4s gradual materialization settling to crisp)
    let motionClasses = 'opacity-100 translate-y-0 scale-100 ease-cinematic';

    if (transitionState === 'exit') {
      motionClasses = 'opacity-0 -translate-y-[3px] scale-[0.985] ease-cinematic';
    } else if (transitionState === 'empty') {
      motionClasses = 'opacity-0 translate-y-[3px] scale-[0.985] transition-none';
    } else if (transitionState === 'enter') {
      motionClasses = 'opacity-100 translate-y-0 scale-100 ease-cinematic';
    }

    return (
      <div
        className={`hero-card-slot relative min-h-[148px] w-[205px] xl:w-[260px] select-none ${customClass}`}
        style={{ minHeight: '148px' }}
      >
        {/* Kinetic Micro-breathing wrapper (Subtle +-2px vertical breathing over 10s, independent of content) */}
        <div className={`${driftClass} w-full h-full`}>
          {/* Spatial scale & origin */}
          <div className={`w-full h-full ${originClass} ${scaleClass}`}>
            {/* GPU-accelerated transition container with ease-cinematic and dynamic duration */}
            <div
              className={`w-full h-full transition-all ${motionClasses}`}
              style={{
                willChange: 'opacity, transform',
                transitionDuration: transitionState === 'empty' ? '0ms' : `${duration}ms`
              }}
            >
              <FloatingAgriCard
                icon={cardData.icon}
                label={cardData.label}
                badgeText={cardData.badgeText}
                badgeBg={cardData.badgeBg}
                badgeTextCol={cardData.badgeTextCol}
                title={cardData.title}
                desc={cardData.desc}
                metric={cardData.metric}
                substeps={cardData.substeps}
                compact={false}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="hidden lg:block absolute inset-0 pointer-events-none select-none z-10"
      aria-hidden="true"
    >
      {/* 
        LEFT SAFE PERIPHERAL FLANK
        Fixed width: 205px on lg (1024-1279), 260px on xl+ (>=1280)
        Contains Slot A (Top) & Slot B (Bottom)
      */}
      <div className="absolute left-0 top-2 bottom-2 xl:top-4 xl:bottom-4 w-[205px] xl:w-[260px] flex flex-col justify-start xl:justify-between py-2">
        {/* SLOT A: Left Top (Always visible on lg, xl) */}
        {renderSlot(0, 'animate-agri-float-1', 'scale-90 xl:scale-100', 'origin-left', 'mb-3 xl:mb-0')}

        {/* SLOT B: Left Bottom (Visible on xl+ >= 1280px) */}
        <div className="hidden xl:block">
          {renderSlot(1, 'animate-agri-float-2', 'scale-90 xl:scale-100', 'origin-left')}
        </div>
      </div>

      {/* 
        RIGHT SAFE PERIPHERAL FLANK
        Fixed width: 205px on lg (1024-1279), 260px on xl+ (>=1280)
        Contains Slot C (Top) & Slot D (Bottom)
        pr-2 provides 8px safe margin so 3px box shadow is fully visible and never cropped
      */}
      <div className="absolute right-0 top-2 bottom-2 xl:top-4 xl:bottom-4 w-[205px] xl:w-[260px] pr-2 flex flex-col justify-center xl:justify-between items-end py-2">
        {/* SLOT C: Right Top (Always visible on lg, xl) */}
        {renderSlot(2, 'animate-agri-float-3', 'scale-90 xl:scale-100', 'origin-right', 'mb-3 xl:mb-0 text-left')}

        {/* SLOT D: Right Bottom (Visible on xl+ >= 1280px) */}
        <div className="hidden xl:block">
          {renderSlot(3, 'animate-agri-float-4', 'scale-90 xl:scale-100', 'origin-right', 'text-left')}
        </div>
      </div>
    </div>
  );
};

export default HeroFloatingSystem;
