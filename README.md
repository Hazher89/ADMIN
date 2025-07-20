# DriftPro - Bedriftsstyring og Avvikshåndtering

DriftPro er en moderne, omfattende bedriftsstyringsløsning designet for å håndtere avvik, dokumenter, kommunikasjon og ledelsesprosesser i bedrifter av alle størrelser.

## 🚀 Funksjoner

### 1. Avvikssystem med bilder og video
- **Rapportering**: Ansatte kan enkelt rapportere avvik direkte fra mobilen
- **Media-støtte**: Last opp bilder og video for bedre dokumentasjon
- **Kategorisering**: Organiser avvik etter type (sikkerhet, kvalitet, miljø, etc.)
- **Alvorlighetsgrad**: Prioriter avvik med ulike alvorlighetsnivåer
- **Admin-håndtering**: Administrerer kan behandle og svare på avvik

### 2. Brukerhåndtering
- **Selvregistrering**: Ansatte kan opprette konto via e-post og passord
- **Admin-kontroll**: Administratorer kan opprette og administrere alle brukere
- **Rollebasert tilgang**: Forskjellige tilgangsnivåer for ansatte og admin
- **Bedriftsbasert**: Hver bedrift har egne brukere og data

### 3. Ledelsessystem (som Landax)
- **Risikoanalyse**: Maler og skjemaer for risikovurdering
- **Dokumentarkiv**: Sentralisert lagring av rutiner, HMS, protokoller
- **Internkontroll**: Revisjonspunkter og kontrollrutiner
- **Samtalearkiv**: Logg over kommunikasjon mellom ansatte og ledelse
- **Bursdagskalender**: Automatiske varsler for bursdager

### 4. Felles chat og varsling
- **Gruppechat**: Avdelings- og bedriftsomfattende chatter
- **Individuelle samtaler**: Privat kommunikasjon mellom ansatte
- **Media-deling**: Del bilder og video i chat
- **Push-varsler**: Varsling ved nye meldinger og hendelser

### 5. Bedriftsbasert struktur
- **Multi-tenant**: Flere bedrifter på samme plattform
- **Lukkede områder**: Hver bedrift har egne data og brukere
- **Tilpasning**: Logo, farger og innhold per bedrift
- **Admin per bedrift**: Dedikert administrator for hver bedrift

## 🛠 Teknisk Stack

- **Frontend**: SwiftUI (iOS)
- **Backend**: Firebase
  - **Authentication**: Firebase Auth
  - **Database**: Firestore
  - **Storage**: Firebase Storage
  - **Push Notifications**: Firebase Cloud Messaging
- **Arkitektur**: MVVM med Combine
- **Minimum iOS**: 15.0+

## 📱 App-struktur

```
DriftPro/
├── Models/                 # Data models
│   ├── User.swift
│   ├── Company.swift
│   ├── Deviation.swift
│   ├── Chat.swift
│   └── Document.swift
├── Views/                  # UI Views
│   ├── Components/         # Reusable components
│   ├── LoadingView.swift
│   ├── CompanySelectionView.swift
│   ├── LoginView.swift
│   ├── MainTabView.swift
│   ├── DashboardView.swift
│   ├── DeviationListView.swift
│   ├── ChatListView.swift
│   ├── DocumentListView.swift
│   ├── ProfileView.swift
│   └── PlaceholderViews.swift
├── Services/               # Business logic
│   └── FirebaseManager.swift
├── DriftProApp.swift       # App entry point
└── GoogleService-Info.plist # Firebase config
```

## 🔧 Installasjon og Oppsett

### Forutsetninger
- Xcode 14.0 eller nyere
- iOS 15.0+ som målplattform
- Firebase-prosjekt opprettet

### 1. Klone prosjektet
```bash
git clone <repository-url>
cd DriftPro
```

### 2. Firebase-oppsett
1. Gå til [Firebase Console](https://console.firebase.google.com/)
2. Opprett et nytt prosjekt
3. Legg til iOS-app:
   - Bundle ID: `com.yourcompany.DriftPro`
   - App nickname: `DriftPro`
4. Last ned `GoogleService-Info.plist`
5. Erstatt placeholder-filen i prosjektet med den nedlastede filen

### 3. Firebase-konfigurasjon
Aktiver følgende Firebase-tjenester:
- **Authentication**: E-post/passord
- **Firestore Database**: Strukturert data
- **Storage**: Fil-opplasting
- **Cloud Messaging**: Push-varsler

### 4. Firestore-regler
Sett opp sikkerhetsregler for Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own company's data
    match /users/{userId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId;
    }
    
    match /companies/{companyId} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.companyId == companyId;
    }
    
    match /deviations/{deviationId} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.companyId == resource.data.companyId;
    }
    
    // Similar rules for documents, chats, etc.
  }
}
```

### 5. Bygg og kjør
1. Åpne `DriftPro.xcodeproj` i Xcode
2. Velg målplattform (iPhone/iPad)
3. Bygg og kjør prosjektet (⌘+R)

## 🎨 Design-prinsipper

### Moderne og brukervennlig
- **Konsistent design**: Samme visuelt språk gjennom hele appen
- **Intuitiv navigasjon**: Enkel å forstå og bruke
- **Responsivt design**: Fungerer på alle iOS-enheter
- **Tilgjengelighet**: Støtte for VoiceOver og andre tilgjengelighetsfunksjoner

### Fargepalett
- **Primærfarge**: Blå (#007AFF)
- **Sekundærfarge**: Lilla (#5856D6)
- **Suksess**: Grønn (#34C759)
- **Advarsel**: Oransje (#FF9500)
- **Feil**: Rød (#FF3B30)

### Typografi
- **Overskrifter**: SF Pro Display Bold
- **Brødtekst**: SF Pro Text Regular
- **Knapper**: SF Pro Text Semibold

## 🔒 Sikkerhet

### Autentisering
- Firebase Authentication med e-post/passord
- Sikker token-håndtering
- Automatisk utlogging ved inaktivitet

### Datasikkerhet
- Firestore sikkerhetsregler
- Bedriftsbasert dataseparasjon
- Kryptert kommunikasjon

### Personvern
- GDPR-kompatibel
- Minimal datainnsamling
- Brukerkontroll over egne data

## 🚀 Utvidelser og fremtidige funksjoner

### Planlagte funksjoner
- **Web-dashboard**: Administrasjon via nettleser
- **API-integrasjon**: Kobling mot andre systemer
- **Rapportering**: Avanserte rapporter og analyser
- **Offline-støtte**: Fungerer uten internett
- **Multi-språk**: Støtte for flere språk

### Tekniske forbedringer
- **Performance**: Optimalisering av datalasting
- **Caching**: Lokal caching for raskere tilgang
- **Testing**: Omfattende test-suite
- **CI/CD**: Automatisert bygging og testing

## 📞 Support og bidrag

### Rapportering av feil
- Bruk GitHub Issues for feilrapporter
- Inkluder detaljerte beskrivelser og skjermbilder
- Spesifiser iOS-versjon og enhet

### Bidrag
- Fork prosjektet
- Opprett feature branch
- Send pull request med beskrivelse av endringer

### Kontakt
- **E-post**: support@driftpro.no
- **Dokumentasjon**: [Wiki](link-to-wiki)
- **Discord**: [DriftPro Community](link-to-discord)

## 📄 Lisens

Dette prosjektet er lisensiert under MIT License - se [LICENSE](LICENSE) filen for detaljer.

## 🙏 Takk

Takk til alle som har bidratt til DriftPro-prosjektet. Spesiell takk til:
- Firebase-teamet for den utmerkede plattformen
- SwiftUI-community for inspirasjon og støtte
- Alle beta-testere som har gitt verdifull tilbakemelding

---

**DriftPro** - Moderne bedriftsstyring for det digitale arbeidslivet 🏢✨ 