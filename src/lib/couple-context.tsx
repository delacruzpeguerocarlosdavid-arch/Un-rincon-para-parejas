import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface CoupleProfile {
  partner1: string;
  partner2: string;
  petName: string;
  anniversaryDate: string; // YYYY-MM-DD
  includeVerse: boolean;
  coupleCode: string;
  isCustomized: boolean;
}

const DEFAULT_COUPLE: CoupleProfile = {
  partner1: 'Carlos',
  partner2: 'Mimie',
  petName: 'Appa',
  anniversaryDate: '2023-11-20',
  includeVerse: true,
  coupleCode: 'RINCON-2026',
  isCustomized: false,
};

interface CoupleContextType {
  couple: CoupleProfile;
  updateCouple: (data: Partial<CoupleProfile>) => void;
  resetCouple: () => void;
  daysTogether: number;
}

const CoupleContext = createContext<CoupleContextType | undefined>(undefined);

export function CoupleProvider({ children }: { children: ReactNode }) {
  const [couple, setCouple] = useState<CoupleProfile>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('un_rincon_couple_profile');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_COUPLE;
  });

  useEffect(() => {
    try {
      localStorage.setItem('un_rincon_couple_profile', JSON.stringify(couple));
    } catch {}
  }, [couple]);

  function updateCouple(data: Partial<CoupleProfile>) {
    setCouple(prev => ({
      ...prev,
      ...data,
      isCustomized: true,
    }));
  }

  function resetCouple() {
    setCouple(DEFAULT_COUPLE);
    try {
      localStorage.removeItem('un_rincon_couple_profile');
    } catch {}
  }

  // Cálculo preciso de días juntos
  const daysTogether = Math.max(
    1,
    Math.floor((Date.now() - new Date(couple.anniversaryDate).getTime()) / (1000 * 60 * 60 * 24))
  );

  return (
    <CoupleContext.Provider value={{ couple, updateCouple, resetCouple, daysTogether }}>
      {children}
    </CoupleContext.Provider>
  );
}

export function useCouple() {
  const context = useContext(CoupleContext);
  if (!context) {
    // Fallback seguro si se usa fuera del Provider
    return {
      couple: DEFAULT_COUPLE,
      updateCouple: () => {},
      resetCouple: () => {},
      daysTogether: 365,
    };
  }
  return context;
}
