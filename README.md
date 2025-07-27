# DriftPro Admin - Avansert Administrasjonssystem

Et komplett og avansert administrasjonssystem for DriftPro med full funksjonalitet for å styre både iOS og Android appene.

## 🚀 Funksjoner

### 🔐 Sikkerhet & Autentisering
- Firebase Authentication
- Rollebasert tilgangskontroll (Admin, Avdelingsleder, Ansatt)
- GDPR-compliance
- Sikker session-håndtering

### 👥 Brukeradministrasjon
- **Ansatte**: Avansert skjema med tilganger og tillatelser
- **Avdelinger**: Avdelingsstyring med ledere og ansatte
- **Tilganger**: Granulær kontroll over funksjoner og data

### 📅 Fravær & Ferie
- **Fravær**: Komplett system med godkjenning/avvisning
- **Ferie**: Avansert feriesystem med kalender og dager-overføring
- **5 års oversikt**: Historikk og fremtidig planlegging
- **Automatisk varsling**: E-post og push-notifikasjoner

### ⚠️ Avvikshåndtering
- **Unik ID**: Sporing av alle avvik
- **Status tracking**: Pending → In Progress → Resolved
- **Kommentarer**: Kommunikasjon mellom parter
- **Prioritering**: Kritisk, Høy, Medium, Lav

### 💬 Chat & Kommunikasjon
- **WhatsApp-lignende**: Grupper, PM, filer, bilder, video
- **Read receipts**: Se hvem som har lest meldinger
- **Real-time**: Øyeblikkelig oppdateringer
- **Fildeling**: Støtte for alle filtyper

### 📄 Dokumenter
- **Fildeling**: PDF, Word, Excel, PowerPoint, Video
- **Tilganger**: Granulær kontroll over hvem som kan se/endre
- **Versjonering**: Sporing av endringer
- **Søk**: Avansert søkefunksjonalitet

### ⏰ Skiftplan & Stemple
- **Skiftplan**: Dag, uke, måned, år
- **E-post varsling**: Automatisk til ansatte
- **Godkjenning**: Ansatte kan godkjenne/avvise skift
- **Stemple**: Time tracking med lokasjon

### 📊 Rapporter & Analytics
- **Diagrammer**: Visualisering av data
- **Lovdata-integrasjon**: Compliance tracking
- **Rød/grønn status**: Oversikt over regelverket
- **Eksport**: PDF, Excel, CSV

### 🔔 Notifikasjoner
- **Real-time**: Øyeblikkelige varsler
- **Klikkbar**: Direkte navigering til relevant side
- **Kategorisert**: Fravær, ferie, avvik, chat, etc.
- **Push-notifikasjoner**: Mobil og web

## 🛠️ Teknisk Stack

### Frontend
- **Next.js 14**: App Router, Server Components
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Ikoner
- **Framer Motion**: Animasjoner
- **React Hook Form**: Form håndtering
- **Zod**: Validering

### Backend & Database
- **Firebase**: Backend-as-a-Service
- **Firestore**: NoSQL database
- **Firebase Auth**: Autentisering
- **Firebase Storage**: Fildeling
- **Firebase Messaging**: Push-notifikasjoner

### State Management
- **React Context**: Global state
- **Real-time listeners**: Live oppdateringer
- **Optimistic updates**: Rask UI feedback

## 📦 Installasjon

### Forutsetninger
- Node.js 18+
- npm eller yarn
- Firebase prosjekt

### Steg

1. **Klon repositoriet**
```bash
git clone https://github.com/your-username/driftpro-admin.git
cd driftpro-admin
```

2. **Installer avhengigheter**
```bash
npm install
```

3. **Konfigurer Firebase**
   - Opprett et Firebase prosjekt
   - Aktiver Authentication, Firestore, Storage, Messaging
   - Kopier konfigurasjonen til `.env.local`

4. **Miljøvariabler**
```bash
cp env.example .env.local
# Rediger .env.local med dine Firebase-opplysninger
```

5. **Start utviklingsserver**
```bash
npm run dev
```

6. **Bygg for produksjon**
```bash
npm run build
npm start
```

## 🔧 Konfigurasjon

### Firebase Setup

1. **Authentication**
   - Aktiver Email/Password
   - Konfigurer tilpassede claims for roller

2. **Firestore Rules**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User can read their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Admin can read all data
    match /{document=**} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

3. **Storage Rules**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🚀 Deployment

### Netlify (Anbefalt)

1. **Koble til GitHub**
   - Push kode til GitHub
   - Koble Netlify til repositoriet

2. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `out`
   - Node version: `18`

3. **Environment Variables**
   - Legg til alle Firebase-variabler i Netlify

4. **Deploy**
   - Netlify vil automatisk bygge og deploye

### Vercel

1. **Import Project**
   - Koble til GitHub repositoriet
   - Vercel vil automatisk oppdage Next.js

2. **Environment Variables**
   - Legg til Firebase-konfigurasjon

3. **Deploy**
   - Vercel håndterer alt automatisk

## 📱 Mobile App Integration

### iOS & Android
- **Firebase SDK**: Deler samme backend
- **Push Notifications**: Real-time varsler
- **Data Sync**: Automatisk synkronisering
- **Offline Support**: Lokal caching

### API Endpoints
Alle mobile apper bruker samme Firebase-backend som web admin.

## 🔒 Sikkerhet

### GDPR Compliance
- **Data Minimization**: Kun nødvendig data lagres
- **Consent Management**: Bruker samtykke
- **Right to be Forgotten**: Sletting av brukerdata
- **Data Portability**: Eksport av brukerdata
- **Audit Logs**: Sporing av alle handlinger

### Sikkerhetstiltak
- **HTTPS**: All kommunikasjon kryptert
- **Input Validation**: Alle inputs valideres
- **SQL Injection Protection**: Firestore er NoSQL
- **XSS Protection**: React håndterer dette automatisk
- **CSRF Protection**: Firebase Auth håndterer dette

## 📊 Performance

### Optimaliseringer
- **Code Splitting**: Automatisk med Next.js
- **Image Optimization**: Next.js Image component
- **Caching**: Firebase caching
- **Lazy Loading**: Komponenter lastes ved behov
- **Bundle Analysis**: `npm run analyze`

### Monitoring
- **Firebase Analytics**: Brukeradferd
- **Error Tracking**: Firebase Crashlytics
- **Performance**: Firebase Performance Monitoring

## 🤝 Bidrag

1. Fork repositoriet
2. Opprett feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit endringer (`git commit -m 'Add some AmazingFeature'`)
4. Push til branch (`git push origin feature/AmazingFeature`)
5. Opprett Pull Request

## 📄 Lisens

Dette prosjektet er lisensiert under MIT License - se [LICENSE](LICENSE) filen for detaljer.

## 📞 Support

- **E-post**: support@driftpro.no
- **Dokumentasjon**: [docs.driftpro.no](https://docs.driftpro.no)
- **Issues**: [GitHub Issues](https://github.com/your-username/driftpro-admin/issues)

## 🔄 Changelog

### v1.0.0 (2024-01-XX)
- 🎉 Første offisielle utgivelse
- ✨ Komplett admin system
- 🔐 Firebase integration
- 📱 Mobile app support
- 🔔 Real-time notifications
- 📊 Advanced reporting
- 🛡️ GDPR compliance

---

**DriftPro Admin** - Avansert administrasjonssystem for moderne bedrifter 🚀
