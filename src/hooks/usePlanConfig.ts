import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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
    supabase
      .from('config')
      .select('id, data')
      .in('id', ['plans', 'settings'])
      .then(({ data, error }) => {
        if (error) { setConfig(DEFAULT_CONFIG); return; }
        const rows = (data ?? []) as { id: string; data: any }[];
        const plans = rows.find(r => r.id === 'plans')?.data ?? {};
        const settings = rows.find(r => r.id === 'settings')?.data ?? {};

        const prices: PlanPrices = { ...DEFAULT_PRICES };
        if (typeof plans.mensal === 'number') prices.mensal = plans.mensal;
        if (typeof plans.trimestral === 'number') prices.trimestral = plans.trimestral;
        if (typeof plans.anual === 'number') prices.anual = plans.anual;

        const isPromotionActive =
          typeof settings.isPromotionActive === 'boolean'
            ? settings.isPromotionActive
            : DEFAULT_CONFIG.isPromotionActive;

        setConfig({ prices, isPromotionActive });
      })
      .then(undefined, () => setConfig(DEFAULT_CONFIG))
      .then(() => setLoading(false));
  }, []);

  return { config, loading };
}
