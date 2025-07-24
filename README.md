# DriftPro Admin Panel

En profesjonell admin-panel for DriftPro som lar deg administrere brukere, avdelinger, chat, avvik, dokumenter og skiftplan for både Android og iOS appene.

## 🚀 Funksjoner

### 🔐 **Autentisering & Tilgangskontroll**
- Bedriftsvelger før innlogging
- Sikker login med e-post/passord
- Rollebasert tilgangskontroll (Super Admin, Admin, Manager, Employee)

### 📊 **Dashboard**
- Oversikt over alle statistikk
- Hurtighandlinger
- Siste aktivitet

### 👥 **Brukeradministrasjon**
- Se alle brukere i bedriften
- Filtrering på rolle og søk
- Brukerstatistikker og status
- Legg til, rediger og slett brukere

### 🏢 **Avdelingsadministrasjon**
- Opprett og administrer avdelinger
- Tildel managere til avdelinger
- Se brukerfordeling per avdeling

### 💬 **Chat-oversikt**
- Se alle chat-rom i bedriften
- Filtre på chat-type (direkte/gruppe)
- Se deltakere og siste meldinger

### ⚠️ **Avvik-administrasjon**
- Oversikt over alle avvik
- Filtrering på status og prioritet
- Se rapporterende bruker og avdeling

### 📄 **Dokumentadministrasjon**
- Se alle dokumenter i bedriften
- Filtrering på kategori
- Se opplastet av og nedlastinger

### 📅 **Skiftplan-administrasjon**
- Oversikt over alle skift
- Filtrering på status og type
- Se clock-in/out tider

### 📈 **Rapporter & Analyser**
- Detaljerte statistikk
- Brukeraktivitet
- Kommunikasjon
- Avvik og dokumenter

### ⚙️ **Innstillinger**
- Profilinformasjon
- Sikkerhet (passord, 2FA)
- Varsler
- Bedriftsinnstillinger

## 🛠️ Teknisk Stack

- **Frontend**: Next.js 14, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **Form Handling**: React Hook Form + Zod
- **Icons**: Heroicons
- **Charts**: Recharts (for fremtidige utvidelser)

## 📦 Installasjon

1. **Klon prosjektet**
```bash
git clone <repository-url>
cd driftpro-admin
```

2. **Installer avhengigheter**
```bash
npm install
```

3. **Konfigurer Firebase**
   - Opprett et Firebase-prosjekt
   - Kopier Firebase-konfigurasjonen til `src/lib/firebase.ts`
   - Aktiver Authentication og Firestore

4. **Start utviklingsserver**
```bash
npm run dev
```

5. **Åpne i nettleseren**
```
http://localhost:3000
```

## 🔧 Konfigurasjon

### Firebase Setup

1. Gå til [Firebase Console](https://console.firebase.google.com/)
2. Opprett et nytt prosjekt
3. Aktiver Authentication (Email/Password)
4. Opprett Firestore database
5. Kopier konfigurasjonen til `src/lib/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "din-api-key",
  authDomain: "ditt-prosjekt.firebaseapp.com",
  projectId: "ditt-prosjekt",
  storageBucket: "ditt-prosjekt.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

### Firestore Collections

Følgende collections må opprettes i Firestore:

- `companies` - Bedriftsinformasjon
- `users` - Brukerdata
- `departments` - Avdelinger
- `chats` - Chat-rom
- `chatMessages` - Chat-meldinger
- `deviations` - Avvik
- `documents` - Dokumenter
- `shifts` - Skiftplan

## 🚀 Deployment

### Netlify (Anbefalt)

1. **Koble til GitHub**
   - Push koden til GitHub
   - Koble Netlify til GitHub-repositoriet

2. **Konfigurer build settings**
   - Build command: `npm run build`
   - Publish directory: `.next`

3. **Sett miljøvariabler**
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - etc.

4. **Deploy**
   - Netlify vil automatisk bygge og deploye

### Vercel

1. **Koble til GitHub**
2. **Import prosjekt**
3. **Konfigurer miljøvariabler**
4. **Deploy**

## 📱 Integrasjon med Mobile Apps

Admin-panelet er designet for å fungere sammen med:
- **DriftPro iOS App** (SwiftUI)
- **DriftPro Android App** (Java/Kotlin)

Begge appene deler samme Firebase-backend og datastruktur.

## 🔒 Sikkerhet

- Firebase Authentication for brukerautentisering
- Firestore Security Rules for datatilgang
- Rollebasert tilgangskontroll
- HTTPS-kryptering
- To-faktor autentisering (2FA)

## 📊 Datastruktur

### Company
```typescript
interface Company {
  id: string;
  name: string;
  logoURL?: string;
  primaryColor?: string;
  secondaryColor?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  website?: string;
  description?: string;
  adminUserId: string;
  subscriptionPlan?: 'basic' | 'premium' | 'enterprise';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### User
```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyId: string;
  departmentId?: string;
  role: 'super_admin' | 'admin' | 'manager' | 'employee';
  phoneNumber?: string;
  avatarURL?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🤝 Bidrag

1. Fork prosjektet
2. Opprett en feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit endringene (`git commit -m 'Add some AmazingFeature'`)
4. Push til branchen (`git push origin feature/AmazingFeature`)
5. Åpne en Pull Request

## 📄 Lisens

Dette prosjektet er lisensiert under MIT License - se [LICENSE](LICENSE) filen for detaljer.

## 📞 Support

For support og spørsmål:
- E-post: support@driftpro.no
- Dokumentasjon: [docs.driftpro.no](https://docs.driftpro.no)

## 🔄 Oppdateringer

- **v1.0.0** - Første release med grunnleggende funksjoner
- **v1.1.0** - Lagt til skiftplan-administrasjon
- **v1.2.0** - Forbedret rapporter og analyser

---

**DriftPro Admin Panel** - Administrer din bedrift med makt og presisjon! 🚀 