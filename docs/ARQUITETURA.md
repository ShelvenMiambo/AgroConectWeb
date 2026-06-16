# Arquitetura — AgroConecta

Visão geral de como as peças do sistema se ligam.

## Diagrama de alto nível

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (React SPA)                       │
│  pages/ · components/ · contexts/AuthContext · lib/services/  │
└───────┬───────────────┬───────────────┬─────────────────────┘
        │               │               │
        │ Firebase SDK  │ fetch /api/*  │ fetch /api/*
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────────────────────────────────┐
│   Firebase   │ │   Cloudflare Pages Functions (functions/) │
│ Auth         │ │  ai-chat ──────────► Google Gemini        │
│ Firestore    │ │  initiate-payment ─► PaySuite             │
│ Storage      │ │  check-payment ────► PaySuite             │
└──────────────┘ │  payment-callback ◄─ PaySuite (webhook)   │
        ▲        │            └──► Firestore REST (ativa plano)│
        └────────┴──────────────────────────────────────────┘
```

O cliente fala **diretamente** com o Firebase (Auth/Firestore/Storage) através do SDK,
protegido pelas `firestore.rules` / `storage.rules`. Para IA e pagamentos, o cliente fala
com **Functions** que escondem as chaves secretas e evitam CORS.

## Frontend

- **React + Vite + TypeScript**. Alias `@/` aponta para `src/`.
- **Tailwind + shadcn/ui** para a UI. Primitivos em `src/components/ui/`.
- **Routing** em `src/App.tsx`:
  - Públicas: `/`, `/login`
  - Protegidas (`ProtectedRoute`): `/marketplace`, `/assistente-ia`, `/producao`, `/negociacoes`, `/perfil`
  - Admin (`AdminRoute`): `/admin`
- **Sessão** em `src/features/auth/context/AuthContext.tsx` — expõe `currentUser`, `userData`, `userRole`,
  e métodos `login/register/logout/loginWithGoogle/resetPassword`.

## Backend (Cloudflare Pages Functions)

Ficheiros em `functions/api/`. Cada um exporta `onRequestPost` (e `onRequestOptions` para CORS).

| Rota | Função |
|------|--------|
| `/api/ai-chat` | Proxy para Gemini. Sanitiza input, limita histórico (10 turnos) e tamanho (2000 chars). |
| `/api/initiate-payment` | Inicia STK push M-Pesa/eMola via PaySuite. |
| `/api/check-payment` | Consulta o estado de uma transação (polling). |
| `/api/payment-callback` | Webhook PaySuite. Verifica assinatura HMAC-SHA256, ativa o plano via Firestore REST. |

## Fluxo de autenticação

1. Utilizador faz login/registo (`AuthContext`).
2. `onAuthStateChanged` dispara → `syncUserToFirestore`.
3. Se for o primeiro acesso, cria `users/{uid}` (inclui `uidPrefix` = primeiros 8 chars do uid,
   usado pelo webhook de pagamento para localizar o utilizador).
4. Se o email == `VITE_ADMIN_EMAIL`, o papel passa a `admin`.

## Fluxo de pagamento (PaySuite)

1. `paysuiteService.initiatePayment()` → POST `/api/initiate-payment`.
2. A Function chama a PaySuite (`/payments/mpesa/push` ou `/payments/emola/push`).
3. O utilizador confirma o STK push no telemóvel.
4. Confirmação por **dois caminhos** (redundância):
   - **Polling**: o cliente chama `/api/check-payment` periodicamente.
   - **Webhook**: PaySuite chama `/api/payment-callback` → valida assinatura → encontra o user
     pelo `uidPrefix` extraído da `reference` (`AGRO-{uid8}-{PLANO}`) → ativa o plano.
5. Em dev sem `VITE_PAYSUITE_API_KEY`, corre em **modo de simulação** (ativa o plano após ~2.5s).

> Referência: `AGRO-{uid8}-{PLANO}` (ex.: `AGRO-ab12cd34-MENSAL`). Planos: `mensal`, `trimestral`, `anual`.

## Fluxo de IA

1. `features/assistente/pages/AssistenteIA.tsx` envia mensagem + histórico → POST `/api/ai-chat`.
2. A Function injeta o system prompt + nota de idioma e chama o Gemini.
3. Voz (opcional, só em browsers compatíveis como o Chrome):
   - **Entrada**: Web Speech API `SpeechRecognition` (`pt-MZ`).
   - **Saída**: `speechSynthesis` lê a resposta (`pt-PT`).

## Segurança

- Chaves de IA e PaySuite vivem **apenas** nas Functions (variáveis de ambiente Cloudflare).
- Firestore e Storage protegidos por regras (ver [MODELO_DADOS.md](MODELO_DADOS.md)).
- Webhook de pagamento valida assinatura HMAC se `PAYSUITE_WEBHOOK_SECRET` estiver definido.
- Números de telefone nas descrições de anúncios são ocultados (`scrubPhoneNumbers`).
- Cabeçalhos de segurança definidos em `firebase.json` (X-Frame-Options, etc.).
