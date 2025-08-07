# DriftPro Admin Panel v1.1

[![Next.js](https://img.shields.io/badge/Next.js-15.4.4-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10.0-orange)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](LICENSE)

## 🚀 Om DriftPro Admin Panel

DriftPro Admin Panel er en omfattende bedriftsadministrasjonsplattform utviklet for moderne bedrifter. Systemet kombinerer kraftig funksjonalitet med intuitivt design for å håndtere alle aspekter av bedriftsadministrasjon.

### ✨ Hovedfunksjoner

- 🔐 **Sikker Autentisering** - Rollebasert tilgangskontroll
- 👥 **Personaladministrasjon** - Komplett ansattstyring
- 🏢 **Avdelingsstyring** - Hierarkisk organisasjonsstruktur
- ⚠️ **HMS-system** - Helse, Miljø og Sikkerhet
- 📊 **Avansert Rapportering** - Real-time statistikk og analyser
- 🤝 **Samarbeidspartnere** - Partneradministrasjon og oppdrag
- 📄 **Dokumenthåndtering** - Sikker filhåndtering
- ⏰ **Vaktplanlegging** - Komplett vaktstyring
- ⏱️ **Tidsregistrering** - Stempel og overtidsberegning
- 📋 **Fravær og ferie** - Søknader og godkjenning
- 💬 **Chat-system** - Intern kommunikasjon
- 🏢 **Bedriftsadministrasjon** - Multi-bedrift støtte
- ⚙️ **Systeminnstillinger** - Konfigurasjon og vedlikehold

## 🛠️ Teknisk Stack

### Frontend
- **Framework**: Next.js 15.4.4 med Turbopack
- **Språk**: TypeScript
- **Styling**: Tailwind CSS
- **Ikoner**: Lucide React
- **State Management**: React Hooks

### Backend & Database
- **Database**: Firebase Firestore
- **Autentisering**: Firebase Auth
- **Storage**: Firebase Storage
- **E-post**: Nodemailer med Domeneshop SMTP
- **API**: Next.js API Routes

### Deployment
- **Plattform**: Netlify
- **URL**: https://driftpro-admin.netlify.app

## 📋 Innholdsfortegnelse

- [Installasjon](#-installasjon)
- [Konfigurasjon](#-konfigurasjon)
- [Bruk](#-bruk)
- [API Dokumentasjon](#-api-dokumentasjon)
- [Struktur](#-struktur)
- [Bidrag](#-bidrag)
- [Lisens](#-lisens)

## 🚀 Installasjon

### Forutsetninger

- Node.js 18 eller nyere
- npm eller yarn
- Firebase-prosjekt
- Domeneshop SMTP-tilgang

### Steg-for-steg installasjon

1. **Klone prosjektet**
   ```bash
   git clone https://github.com/your-username/driftpro-admin.git
   cd driftpro-admin
   ```

2. **Installer avhengigheter**
   ```bash
   npm install
   ```

3. **Konfigurer miljøvariabler**
   ```bash
   cp .env.example .env.local
   ```

4. **Fyll ut miljøvariabler i `.env.local`**
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   DOMENESHOP_SMTP_PASSWORD=your-smtp-password
   ```

5. **Start utviklingsserver**
   ```bash
   npm run dev
   ```

6. **Åpne nettleseren**
   ```
   http://localhost:3000
   ```

## ⚙️ Konfigurasjon

### Firebase Oppsett

1. Opprett et nytt Firebase-prosjekt
2. Aktiver Firestore Database
3. Aktiver Authentication
4. Aktiver Storage
5. Kopier konfigurasjonsdata til miljøvariabler

### E-post Konfigurasjon

Systemet bruker Domeneshop SMTP for e-postvarsling:

- **SMTP Server**: smtp.domeneshop.no
- **Port**: 587
- **Bruker**: noreplay@driftpro.no
- **Sikkerhet**: TLS

### Sikkerhet

- Rollebasert tilgangskontroll implementert
- Firebase Security Rules konfigurert
- Kryptert kommunikasjon
- Session-håndtering

## 📖 Bruk

### Første gang

1. **Opprett administrator**
   - Gå til "Bedrifter" i sidepanelet
   - Klikk "Legg til bedrift"
   - Fyll ut bedriftsinformasjon
   - Legg til administrator

2. **Konfigurer avdelinger**
   - Gå til "Avdelinger"
   - Opprett avdelinger for bedriften
   - Tildel avdelingsledere

3. **Legg til ansatte**
   - Gå til "Ansatte"
   - Legg til ansatte
   - Tildel roller og avdelinger

### Hovedfunksjoner

#### 👥 Personaladministrasjon
- Legg til, rediger og slett ansatte
- Tildel roller (ansatt, avdelingsleder, admin)
- Søk og filtrer ansatte
- E-postvarsling ved endringer

#### ⚠️ HMS-system
- **Avviksbehandling**: Registrer og følg opp avvik
- **Risikostyring**: Risikovurderinger og tiltak
- **Sikkerhet**: Sikkerhetsanalyser og kurs
- **Miljø**: Miljøstyring og bærekraft
- **Kompetanse**: HMS-opplæring og sertifisering
- **Sjekklister**: Sikkerhetskontroller og inspeksjoner
- **Rapportering**: Statistikk og trendanalyse

#### 🤝 Samarbeidspartnere
- Partneroversikt med detaljer
- Tildelt oppdrag med kalender
- E-postkommunikasjon
- PDF-eksport av vakter

#### 📊 Rapporter
- Real-time statistikk
- Genererte rapporter
- Eksport til PDF/Excel
- Planlagte rapporter

## 🔌 API Dokumentasjon

### Autentisering
```http
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/register
```

### Ansatte
```http
GET /api/employees
POST /api/employees
PUT /api/employees/[id]
DELETE /api/employees/[id]
```

### Avdelinger
```http
GET /api/departments
POST /api/departments
PUT /api/departments/[id]
DELETE /api/departments/[id]
```

### HMS
```http
GET /api/deviations
POST /api/deviations
PUT /api/deviations/[id]
DELETE /api/deviations/[id]
```

### E-post
```http
POST /api/send-password-setup
POST /api/send-notification
GET /api/email-settings
POST /api/email-settings
```

## 📁 Struktur

```
driftpro-admin/
├── src/
│   ├── app/
│   │   ├── api/                 # API endepunkter
│   │   ├── dashboard/           # Dashboard sider
│   │   ├── globals.css          # Global styling
│   │   ├── layout.tsx           # Root layout
│   │   └── page.tsx             # Landing page
│   ├── components/              # Gjenbrukbare komponenter
│   ├── lib/                     # Utilities og services
│   └── types/                   # TypeScript definisjoner
├── public/                      # Statiske filer
├── package.json                 # Avhengigheter
├── next.config.js              # Next.js konfigurasjon
├── tailwind.config.js          # Tailwind CSS konfigurasjon
└── tsconfig.json               # TypeScript konfigurasjon
```

## 🧪 Testing

```bash
# Kjør tester
npm test

# Kjør tester i watch mode
npm run test:watch

# Kjør tester med coverage
npm run test:coverage
```

## 🚀 Deployment

### Netlify (Anbefalt)

1. Koble GitHub-repositoriet til Netlify
2. Konfigurer build settings:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `.next`
3. Legg til miljøvariabler i Netlify
4. Deploy

### Vercel

1. Koble GitHub-repositoriet til Vercel
2. Konfigurer miljøvariabler
3. Deploy

## 📊 Statistikk

- **Antall sider**: 13 hovedsider
- **Antall API-endepunkter**: 25+
- **Antall database-collections**: 10+
- **Antall interfaces**: 15+
- **Kodelinjer**: 50,000+

## 🔮 Fremtidige Utvidelser

- [ ] Mobil app (React Native)
- [ ] API integrasjoner
- [ ] Avansert rapportering (BI-tools)
- [ ] Workflow automation
- [ ] Multi-tenant støtte
- [ ] Offline support
- [ ] Real-time notifications
- [ ] Advanced analytics (AI/ML)

## 🤝 Bidrag

1. Fork prosjektet
2. Opprett en feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit endringene (`git commit -m 'Add some AmazingFeature'`)
4. Push til branchen (`git push origin feature/AmazingFeature`)
5. Opprett en Pull Request

## 📝 Lisens

Dette prosjektet er proprietært og eid av DriftPro. Alle rettigheter forbeholdt.

## 📞 Kontakt

- **E-post**: support@driftpro.no
- **Nettside**: https://driftpro.no
- **Admin Panel**: https://driftpro-admin.netlify.app

## 🙏 Takk

Takk til alle som har bidratt til utviklingen av DriftPro Admin Panel v1.1.

---

**Versjon**: 1.1  
**Dato**: August 2024  
**Status**: Produksjonsklar  
**Utvikler**: AI Assistant  
**Lisens**: Proprietær
# Updated Thu Aug  7 22:24:02 CEST 2025
