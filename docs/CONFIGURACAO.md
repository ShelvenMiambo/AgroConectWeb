# Configuração — AgroConecta

Como configurar e fazer deploy do projeto.

## 1. Variáveis de ambiente

Copiar `.env.example` para `.env.local` e preencher. **Nunca** fazer commit de `.env.local`.

| Variável | Onde obter | Notas |
|----------|-----------|-------|
| `VITE_FIREBASE_API_KEY` | Firebase Console → Definições do projeto | |
| `VITE_FIREBASE_AUTH_DOMAIN` | idem | |
| `VITE_FIREBASE_PROJECT_ID` | idem | |
| `VITE_FIREBASE_STORAGE_BUCKET` | idem | |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | idem | |
| `VITE_FIREBASE_APP_ID` | idem | |
| `VITE_ADMIN_EMAIL` | escolhido por ti | email que recebe papel `admin` no 1.º login |
| `VITE_GEMINI_API_KEY` | https://aistudio.google.com/app/apikey | usado pela Function `ai-chat` |
| `VITE_PAYSUITE_API_KEY` | https://app.paysuite.co.mz | vazio = modo simulação (só dev) |

### Variáveis só do servidor (Cloudflare Pages → Settings → Environment variables)

Estas **não** levam o prefixo `VITE_` no cliente, mas as Functions leem-nas do ambiente:

| Variável | Usada por | Notas |
|----------|-----------|-------|
| `VITE_GEMINI_API_KEY` | `ai-chat` | a chave Gemini (server-side) |
| `VITE_PAYSUITE_API_KEY` | `initiate-payment`, `check-payment` | chave PaySuite |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | `payment-callback` | JSON da service account (string) |
| `PAYSUITE_WEBHOOK_SECRET` | `payment-callback` | **configurar no painel** para validar assinatura HMAC |

> ⚠️ Pendência conhecida: `PAYSUITE_WEBHOOK_SECRET` deve ser definida no painel Cloudflare Pages.
> Sem ela, o webhook aceita pedidos sem validar a assinatura.

## 2. Setup do Firebase

1. Criar projeto no [Firebase Console](https://console.firebase.google.com).
2. Ativar **Authentication** → métodos Email/Password e Google.
3. Criar **Firestore Database** (modo produção).
4. Ativar **Storage**.
5. Publicar as regras:
   ```sh
   firebase deploy --only firestore:rules,storage:rules
   ```
   (regras em `firestore.rules` e `storage.rules`; índices em `firestore.indexes.json`)

## 3. Service account (para o webhook de pagamento)

1. Firebase Console → Definições → Contas de serviço → Gerar nova chave privada.
2. Colar o JSON inteiro como valor de `FIREBASE_SERVICE_ACCOUNT_KEY` no Cloudflare Pages.

## 4. Setup PaySuite

1. Criar conta em https://app.paysuite.co.mz.
2. Copiar a API key (`ps_test_...` em dev, `ps_live_...` em produção).
3. Configurar o webhook para: `https://<o-teu-dominio>/api/payment-callback`.
4. Definir o segredo do webhook em `PAYSUITE_WEBHOOK_SECRET`.

## 5. Deploy

### Cloudflare Pages (principal)
- Ligar o repositório no Cloudflare Pages.
- Build command: `npm run build` · Output: `dist`
- Definir todas as variáveis de ambiente (secção 1).
- As Functions em `functions/` são detetadas automaticamente.

### Firebase Hosting (alternativo)
```sh
npm run build
firebase deploy --only hosting
```
> Nota: as Functions em `functions/api/` são **Cloudflare Pages Functions**, não Firebase
> Functions. No Firebase Hosting é preciso uma alternativa para as rotas `/api/*`.

## 6. Desenvolvimento local

```sh
npm install
npm run dev        # http://localhost:5173
```
Sem `VITE_PAYSUITE_API_KEY`, os pagamentos correm em simulação. As Functions `/api/*` só
existem no ambiente Cloudflare — em dev, `ai-chat` e pagamentos reais não respondem localmente
(a IA precisa de deploy ou de um proxy local; os pagamentos usam a simulação).
