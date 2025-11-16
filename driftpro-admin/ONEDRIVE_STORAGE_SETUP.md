# 📁 OneDrive Storage Integration - DriftPro

## 🎯 Oversikt

DriftPro bruker nå **OneDrive (100GB)** som primær lagringsløsning for alle filer (PDFer, bilder, dokumenter, etc.). Dette gir deg **20x mer gratis lagring** enn Firebase Storage (5GB)!

## ✅ Hva er implementert?

### Automatisk OneDrive-integrasjon
- ✅ Alle filer lastes automatisk opp til OneDrive hvis du er logget inn med Microsoft 365
- ✅ Fallback til Firebase Storage hvis OneDrive ikke er tilgjengelig
- ✅ Automatisk organisering i mapper: `DriftPro/documents/{companyId}/`
- ✅ Støtte for store filer (>4MB) med resumable upload
- ✅ Automatisk sletting fra OneDrive når filer slettes i applikasjonen

## 🔧 Setup

### 1. Logg inn med Microsoft 365

1. Gå til **Dashboard → E-post** eller **Dashboard → E-post System**
2. Klikk **"Logg inn med Microsoft 365"**
3. Godkjenn tilgang til OneDrive når du blir bedt om det

### 2. Verifiser OneDrive-tilgang

Etter innlogging vil alle nye filer automatisk lastes opp til OneDrive i stedet for Firebase Storage.

## 📂 Lagringsstruktur i OneDrive

Alle filer organiseres automatisk i OneDrive:

```
OneDrive/
└── DriftPro/
    └── documents/
        └── {companyId}/
            ├── {timestamp}_document1.pdf
            ├── {timestamp}_document2.pdf
            └── ...
```

## 🎯 Hvordan det fungerer

### Opplasting av filer:
1. **Bruker laster opp fil** i DriftPro
2. **System sjekker** om Microsoft Graph er autentisert
3. **Hvis ja:** Fil lastes opp til OneDrive
4. **Hvis nei:** Fil lastes opp til Firebase Storage (fallback)
5. **Metadata lagres** i Firestore med `storageType` og `oneDriveItemId`

### Sletting av filer:
1. **Bruker sletter fil** i DriftPro
2. **System sjekker** `storageType` i Firestore
3. **Hvis OneDrive:** Sletter fra OneDrive ved hjelp av `oneDriveItemId`
4. **Hvis Firebase:** Sletter fra Firebase Storage
5. **Metadata slettes** fra Firestore

## 📊 Fordeler med OneDrive

### ✅ 100GB Gratis Lagring
- **20x mer** enn Firebase Storage (5GB)
- Inkludert i Office 365-abonnementet ditt
- Ingen ekstra kostnader

### ✅ Automatisk Organisering
- Filer organiseres automatisk i mapper
- Lett å finne og administrere
- Synkronisert med OneDrive-appen

### ✅ Sikkerhet
- Enterprise-grade sikkerhet
- GDPR-kompatibel
- Automatisk backup

### ✅ Integrasjon
- Se filer direkte i OneDrive-appen
- Del filer med kollegaer
- Offline-tilgang via OneDrive-appen

## 🔍 Sjekk lagringsbruk

Du kan sjekke hvor mye plass du har brukt i OneDrive:

1. Gå til [OneDrive](https://onedrive.live.com)
2. Se lagringsbruk i nedre venstre hjørne
3. Eller bruk OneDrive-appen på telefonen

## ⚙️ Tekniske Detaljer

### API-endepunkter brukt:
- `POST /me/drive/items/{folderId}:/{fileName}:/content` - Enkel opplasting (<4MB)
- `POST /me/drive/items/{folderId}:/{fileName}:/createUploadSession` - Resumable opplasting (>4MB)
- `GET /me/drive/items/{itemId}` - Hent filinfo
- `DELETE /me/drive/items/{itemId}` - Slett fil
- `GET /me/drive?$select=quota` - Hent lagringskvota

### Støttede filtyper:
- ✅ PDF
- ✅ Bilder (JPG, PNG, GIF, etc.)
- ✅ Dokumenter (Word, Excel, PowerPoint)
- ✅ Alle andre filtyper

### Filstørrelsesgrenser:
- **Enkel opplasting:** Opp til 4MB
- **Resumable opplasting:** Opp til 100GB (OneDrive-grense)

## 🚨 Feilsøking

### Problem: Filer lastes ikke opp til OneDrive

**Løsning:**
1. Sjekk at du er logget inn med Microsoft 365
2. Gå til Dashboard → E-post System
3. Klikk "Logg inn med Microsoft 365" hvis nødvendig
4. Godkjenn OneDrive-tilgang

### Problem: "Files.ReadWrite permission required"

**Løsning:**
1. Gå til [Azure Portal](https://portal.azure.com)
2. Naviger til "App registrations" → Din app
3. Gå til "API permissions"
4. Legg til `Files.ReadWrite` permission
5. Klikk "Grant admin consent"

### Problem: Filer faller tilbake til Firebase Storage

**Mulige årsaker:**
- Du er ikke logget inn med Microsoft 365
- OneDrive-tilgang er ikke godkjent
- Nettverksfeil under opplasting

**Løsning:**
- Logg inn på nytt med Microsoft 365
- Sjekk nettverkstilkoblingen
- Filer vil fortsatt fungere via Firebase Storage fallback

## 📝 Notater

- **Eksisterende filer:** Filer som allerede er lastet opp til Firebase Storage forblir der
- **Nye filer:** Alle nye filer lastes opp til OneDrive hvis du er logget inn
- **Migrering:** Du kan manuelt migrere eksisterende filer hvis ønskelig (ikke implementert ennå)

## 🎉 Oppsummering

Med OneDrive-integrasjonen har du nå:
- ✅ **100GB gratis lagring** (vs 5GB i Firebase)
- ✅ **Automatisk opplasting** til OneDrive
- ✅ **Automatisk organisering** i mapper
- ✅ **Fallback til Firebase** hvis OneDrive ikke er tilgjengelig
- ✅ **Sømløs integrasjon** med eksisterende funksjonalitet

**Ingen ekstra kostnader - alt inkludert i Office 365!** 🎊

