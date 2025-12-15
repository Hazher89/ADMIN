# 🔒 Deploy Firebase Security Rules

Dette dokumentet forklarer hvordan du deployer Firestore Security Rules og Storage Rules til Firebase.

## 📋 Forutsetninger

1. **Firebase CLI installert**
   ```bash
   npm install -g firebase-tools
   ```

2. **Logg inn på Firebase**
   ```bash
   firebase login
   ```

3. **Initialiser Firebase (hvis ikke allerede gjort)**
   ```bash
   firebase init
   ```
   Velg:
   - Firestore
   - Storage
   - (Ikke Hosting hvis du bruker Netlify)

## 🚀 Deploy Security Rules

### 1. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### 2. Deploy Storage Rules
```bash
firebase deploy --only storage:rules
```

### 3. Deploy begge samtidig
```bash
firebase deploy --only firestore:rules,storage:rules
```

### 4. Deploy Firestore Indexes (hvis nødvendig)
```bash
firebase deploy --only firestore:indexes
```

## ✅ Verifisering

Etter deploy kan du verifisere at reglene er aktive:

1. **I Firebase Console:**
   - Gå til Firestore Database → Rules
   - Gå til Storage → Rules
   - Sjekk at reglene er oppdatert

2. **Test reglene:**
   - Prøv å lese/skrive data som en vanlig ansatt
   - Verifiser at de kun kan se sin egen data
   - Test at avdelingsledere kan se data fra sin avdeling
   - Test at admin har full tilgang

## 🔍 Viktige Sikkerhetsregler

### Firestore Rules
- ✅ **Users**: Kun egen data, admin kan alt, avdelingsledere kan se sin avdeling
- ✅ **Absences**: Ansatte kun egen, avdelingsledere sin avdeling, admin alt
- ✅ **Vacations**: Ansatte kun egen, avdelingsledere sin avdeling, admin alt
- ✅ **Shifts**: Ansatte kun egen, avdelingsledere sin avdeling, admin alt
- ✅ **Timeclocks**: Ansatte kun egen, avdelingsledere sin avdeling (ikke seg selv), admin alt
- ✅ **Deviations**: Ansatte kun egne, avdelingsledere sin avdeling, admin alt
- ✅ **Partners**: Full tilgang for alle autentiserte brukere
- ✅ **Documents**: Ansatte kun egne, avdelingsledere sin avdeling, admin alt

### Storage Rules
- ✅ **Documents**: Company-based access med rollebasert tilgang
- ✅ **Partner files**: Full tilgang for alle autentiserte brukere
- ✅ **Chat files**: Tilgang for deltakere i chatten

## ⚠️ Viktig

**Disse reglene er kritiske for sikkerhet!** De forhindrer at brukere kan omgå kode-tilgangskontrollen ved å kalle Firebase direkte.

**Deploy alltid reglene etter endringer i tilgangskontroll-logikken!**

## 🔄 Oppdatering av Regler

Hvis du gjør endringer i `firestore.rules` eller `storage.rules`:

1. Test lokalt (hvis mulig)
2. Deploy til Firebase
3. Verifiser at alt fungerer som forventet
4. Test med forskjellige brukerroller

## 📝 Notater

- Reglene bruker helper-funksjoner for å unngå duplisering
- Alle regler sjekker autentisering først (`request.auth != null`)
- Default er "deny all" for ukjente collections
- Avdelingsledere kan IKKE endre sine egne timer (kun admin kan)

