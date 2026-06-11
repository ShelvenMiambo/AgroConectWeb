/**
 * Cloudflare Pages Function — PaySuite Payment Webhook
 * Rota: /api/payment-callback
 *
 * Fluxo:
 *  1. PaySuite envia POST com { transaction_id, status, reference }
 *  2. Verificamos o pagamento diretamente na API PaySuite
 *  3. Extraímos o uid e plano da referência (AGRO-{uid8}-{PLANO})
 *  4. Atualizamos o Firestore via REST API com o plano ativado
 */

interface Env {
  VITE_PAYSUITE_API_KEY: string;
  VITE_FIREBASE_PROJECT_ID: string;
  FIREBASE_SERVICE_ACCOUNT_KEY: string;
  PAYSUITE_WEBHOOK_SECRET?: string;
}

interface PaySuiteWebhook {
  transaction_id?: string;
  id?: string;
  status: string;
  reference: string;
  amount?: number;
}

interface FirestoreUpdate {
  fields: Record<string, { stringValue?: string; timestampValue?: string }>;
}

const PAYSUITE_BASE_URL = 'https://app.paysuite.co.mz/api/v1';

async function verifyWebhookSignature(
  request: Request,
  rawBody: string,
  secret: string
): Promise<boolean> {
  const signature = request.headers.get('x-paysuite-signature') ||
                    request.headers.get('x-signature') ||
                    request.headers.get('x-webhook-signature');
  if (!signature) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
  const expected = Array.from(new Uint8Array(mac))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return signature === expected || signature === `sha256=${expected}`;
}

async function getFirestoreToken(serviceAccountJson: string): Promise<string> {
  const sa = JSON.parse(serviceAccountJson);

  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: sa.client_email,
    sub: sa.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/datastore',
  };

  const encode = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const signingInput = `${encode(header)}.${encode(payload)}`;

  // Import the RSA private key
  const pemBody = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');
  const keyBuffer = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBuffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(signingInput)
  );

  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const jwt = `${signingInput}.${sigB64}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const tokenData = await tokenRes.json() as { access_token: string };
  return tokenData.access_token;
}

async function verifyPaySuiteTransaction(
  transactionId: string,
  apiKey: string
): Promise<'success' | 'pending' | 'failed'> {
  const res = await fetch(`${PAYSUITE_BASE_URL}/payments/${transactionId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) return 'failed';
  const data = await res.json() as { status: string };
  const s = data.status?.toLowerCase();
  if (s === 'completed' || s === 'success') return 'success';
  if (s === 'failed' || s === 'cancelled') return 'failed';
  return 'pending';
}

async function activatePlanFirestore(
  uid: string,
  plan: string,
  projectId: string,
  accessToken: string
): Promise<void> {
  const expiry = new Date();
  if (plan === 'mensal')     expiry.setMonth(expiry.getMonth() + 1);
  if (plan === 'trimestral') expiry.setMonth(expiry.getMonth() + 3);
  if (plan === 'anual')      expiry.setFullYear(expiry.getFullYear() + 1);

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}?updateMask.fieldPaths=plan&updateMask.fieldPaths=planAtivadoEm&updateMask.fieldPaths=planExpiraEm`;

  const body: FirestoreUpdate = {
    fields: {
      plan:          { stringValue: plan },
      planAtivadoEm: { timestampValue: new Date().toISOString() },
      planExpiraEm:  { stringValue: expiry.toISOString() },
    },
  };

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Firestore update failed: ${err}`);
  }
}

export async function onRequestPost(context: { request: Request; env: Env; waitUntil: (p: Promise<unknown>) => void }) {
  const { request, env } = context;

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  // Validate webhook signature if secret is configured
  if (env.PAYSUITE_WEBHOOK_SECRET) {
    const valid = await verifyWebhookSignature(request, rawBody, env.PAYSUITE_WEBHOOK_SECRET);
    if (!valid) {
      console.error('[Webhook] Invalid signature — request rejected');
      return new Response('Unauthorized', { status: 401 });
    }
  }

  let body: PaySuiteWebhook;
  try {
    body = JSON.parse(rawBody) as PaySuiteWebhook;
  } catch {
    return new Response('Bad Request: invalid JSON', { status: 400 });
  }

  const transactionId = body.transaction_id || body.id;
  const { status, reference } = body;

  if (!transactionId || !reference) {
    return new Response('Bad Request: missing transaction_id or reference', { status: 400 });
  }

  // Respond immediately to PaySuite so it doesn't retry
  // Process the activation in the background via waitUntil
  context.waitUntil(
    processPayment(transactionId, status, reference, env).catch(err =>
      console.error('[Webhook] Background processing error:', err)
    )
  );

  return new Response('OK', { status: 200 });
}

async function processPayment(
  transactionId: string,
  status: string,
  reference: string,
  env: Env
): Promise<void> {
  // Only process completed payments
  if (status?.toLowerCase() !== 'completed' && status?.toLowerCase() !== 'success') {
    console.log(`[Webhook] Ignoring status: ${status}`);
    return;
  }

  // Double-check with PaySuite API to prevent replay attacks
  const verified = await verifyPaySuiteTransaction(transactionId, env.VITE_PAYSUITE_API_KEY);
  if (verified !== 'success') {
    console.error(`[Webhook] Transaction ${transactionId} not confirmed by PaySuite`);
    return;
  }

  // Parse reference: AGRO-{uid8}-{PLAN} e.g. AGRO-ab12cd34-MENSAL
  const match = reference.match(/^AGRO-([a-zA-Z0-9]+)-([A-Z]+)$/);
  if (!match) {
    console.error(`[Webhook] Unrecognized reference format: ${reference}`);
    return;
  }

  const uidPrefix = match[1];
  const plan = match[2].toLowerCase();

  if (!['mensal', 'trimestral', 'anual'].includes(plan)) {
    console.error(`[Webhook] Unknown plan: ${plan}`);
    return;
  }

  const accessToken = await getFirestoreToken(env.FIREBASE_SERVICE_ACCOUNT_KEY);

  // Query Firestore for user with matching uidPrefix field
  const queryUrl = `https://firestore.googleapis.com/v1/projects/${env.VITE_FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery`;
  const queryBody = {
    structuredQuery: {
      from: [{ collectionId: 'users' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'uidPrefix' },
          op: 'EQUAL',
          value: { stringValue: uidPrefix },
        },
      },
      limit: 1,
    },
  };

  const queryRes = await fetch(queryUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(queryBody),
  });

  const queryData = await queryRes.json() as Array<{ document?: { name: string } }>;
  const docName = queryData[0]?.document?.name;

  if (!docName) {
    console.error(`[Webhook] User not found for uidPrefix: ${uidPrefix}`);
    return;
  }

  const fullUid = docName.split('/').pop()!;
  await activatePlanFirestore(fullUid, plan, env.VITE_FIREBASE_PROJECT_ID, accessToken);
  console.log(`[Webhook] Plan "${plan}" activated for user ${fullUid}`);
}
