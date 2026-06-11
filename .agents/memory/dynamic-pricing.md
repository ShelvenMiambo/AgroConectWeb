---
name: Dynamic pricing architecture
description: How plan prices and promotion state are stored and consumed across AgroConecta
---

The rule: All plan prices and promotion state come from Firestore, never hardcoded constants.

- Firestore `config/plans` doc: `{ mensal: number, trimestral: number, anual: number }`
- Firestore `config/settings` doc: `{ isPromotionActive: boolean }`
- Hook `src/hooks/usePlanConfig.ts` fetches both docs, returns defaults (1 MT prices, promotion active) on failure.
- Default test prices: 1 MT for all plans. Production reference prices: 200/580/2000 MT.
- `IS_PROMOTION_FREE` in `src/lib/utils.ts` is a dead export — no page imports it. Use `config.isPromotionActive` from the hook instead.
- Admin can change prices and toggle promotion from the Admin panel → "Preços" tab.

**Why:** Allows price changes without code deploys. Admin manages pricing live from the dashboard.

**How to apply:** Any new page that shows plan prices must import `usePlanConfig` and use `config.prices.*` and `config.isPromotionActive`.
