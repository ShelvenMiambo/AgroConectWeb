import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface PlanPrices {
  mensal: number;
  trimestral: number;
  anual: number;
}

export interface PlanConfig {
  prices: PlanPrices;
  isPromotionActive: boolean;
}

export const DEFAULT_PRICES: PlanPrices = {
  mensal: 1,
  trimestral: 1,
  anual: 1,
};

const DEFAULT_CONFIG: PlanConfig = {
  prices: DEFAULT_PRICES,
  isPromotionActive: true,
};

export function usePlanConfig(): { config: PlanConfig; loading: boolean } {
  const [config, setConfig] = useState<PlanConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDoc(doc(db, 'config', 'plans')),
      getDoc(doc(db, 'config', 'settings')),
    ])
      .then(([plansSnap, settingsSnap]) => {
        const prices: PlanPrices = { ...DEFAULT_PRICES };
        if (plansSnap.exists()) {
          const d = plansSnap.data();
          if (typeof d.mensal === 'number')     prices.mensal = d.mensal;
          if (typeof d.trimestral === 'number') prices.trimestral = d.trimestral;
          if (typeof d.anual === 'number')      prices.anual = d.anual;
        }
        const isPromotionActive =
          settingsSnap.exists() && typeof settingsSnap.data().isPromotionActive === 'boolean'
            ? settingsSnap.data().isPromotionActive
            : DEFAULT_CONFIG.isPromotionActive;

        setConfig({ prices, isPromotionActive });
      })
      .catch(() => setConfig(DEFAULT_CONFIG))
      .finally(() => setLoading(false));
  }, []);

  return { config, loading };
}
