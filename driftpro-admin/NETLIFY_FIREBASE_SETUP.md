# 🔥 Firebase Miljøvariabler i Netlify

Build-feilen skyldes manglende Firebase-miljøvariabler i Netlify.

## 📋 Legg til Firebase-miljøvariabler i Netlify

1. Gå til: https://app.netlify.com
2. Velg prosjekt: **admin.driftpro.no**
3. Gå til: **"Site settings"** → **"Environment variables"**
4. Legg til følgende variabler:

### Firebase Client SDK Variabler (NEXT_PUBLIC_*)

```
NEXT_PUBLIC_FIREBASE_API_KEY=[din Firebase API key]
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=[din Firebase Auth domain]
NEXT_PUBLIC_FIREBASE_PROJECT_ID=[din Firebase Project ID]
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=[din Firebase Storage bucket]
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=[din Firebase Messaging Sender ID]
NEXT_PUBLIC_FIREBASE_APP_ID=[din Firebase App ID]
```

### Firebase Admin SDK Variabler (Server-side)

```
FIREBASE_PROJECT_ID=[din Firebase Project ID]
FIREBASE_CLIENT_EMAIL=[din Service Account Client Email]
FIREBASE_PRIVATE_KEY=[din Service Account Private Key]
```

## 🔍 Hvor finner jeg Firebase-credentials?

1. Gå til: https://console.firebase.google.com
2. Velg prosjektet ditt
3. Gå til: **⚙️ Project settings** (tannhjul-ikonet)
4. Scroll ned til **"Your apps"**-seksjonen
5. Klikk på web-appen din (eller opprett ny hvis den ikke finnes)
6. Kopier verdiene fra Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",           // → NEXT_PUBLIC_FIREBASE_API_KEY
  authDomain: "...",           // → NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  projectId: "...",            // → NEXT_PUBLIC_FIREBASE_PROJECT_ID
  storageBucket: "...",        // → NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "...",    // → NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  appId: "1:..."               // → NEXT_PUBLIC_FIREBASE_APP_ID
};
```

### For Admin SDK (Service Account):

1. I Firebase Console, gå til: **⚙️ Project settings** → **"Service accounts"**
2. Klikk: **"Generate new private key"**
3. Last ned JSON-filen
4. Fra JSON-filen, kopier:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (hele private key, inkludert `-----BEGIN PRIVATE KEY-----` og `-----END PRIVATE KEY-----`)

## ⚠️ Viktig for FIREBASE_PRIVATE_KEY

Når du legger til `FIREBASE_PRIVATE_KEY` i Netlify:
- Huk av **"Contains secret values"**
- Lim inn hele private key-en, inkludert linjeskift
- Netlify håndterer multiline-verdier automatisk

## ✅ Etter du har lagt til variablene

1. Trigger ny deploy: **"Deploys"** → **"Trigger deploy"**
2. Vent til build er ferdig
3. Test at alt fungerer

## 🔍 Sjekk at variablene er satt

I Netlify build logs, skal du se at Firebase initialiseres uten feil.
