# Permanent Tilgang til E-post og OneDrive - Setup Guide

Denne guiden forklarer hvordan du setter opp **permanent tilgang** til Microsoft Graph API (e-post og OneDrive) uten at brukere må logge inn med Microsoft Graph hver gang.

## 🎯 Hva dette gir deg

- ✅ **Automatisk e-post-sending** fra systemet (velkomstmail, varsler, etc.)
- ✅ **Automatisk OneDrive-lagring** av dokumenter, kjørelister, etc.
- ✅ **Ingen brukerinnlogging** nødvendig - systemet har alltid tilgang
- ✅ **Sentral konfigurasjon** - settes opp én gang, fungerer permanent

## 📋 Forutsetninger

1. Microsoft 365/Office 365 konto
2. Tilgang til Azure Portal (Global Administrator eller Application Administrator)
3. En dedikert e-postkonto eller delt postboks for systemet (f.eks. `noreply@dittfirma.no`)

## 🔧 Steg-for-steg Setup

### Steg 1: Opprett App Registration i Azure Portal

1. Gå til [Azure Portal](https://portal.azure.com)
2. Naviger til **Azure Active Directory** > **App registrations**
3. Klikk **New registration**
4. Fyll inn:
   - **Name**: `DriftPro System Service`
   - **Supported account types**: `Accounts in this organizational directory only (Single tenant)`
   - **Redirect URI**: La stå tom (ikke nødvendig for app-only)
5. Klikk **Register**

### Steg 2: Konfigurer Application Permissions (IKKE Delegated!)

1. I app-registreringen, gå til **API permissions**
2. Klikk **Add a permission**
3. Velg **Microsoft Graph**
4. Velg **Application permissions** (IKKE Delegated!)
5. Legg til følgende permissions:
   - ✅ `Mail.Send` - Send e-post som hvilken som helst bruker
   - ✅ `Files.ReadWrite.All` - Full tilgang til OneDrive for alle brukere
   - ✅ `User.Read.All` - Les brukerinformasjon (valgfritt, for avanserte funksjoner)
6. Klikk **Add permissions**
7. **VIKTIG**: Klikk **Grant admin consent for [ditt firma]**
   - Dette gir appen permanent tillatelse uten brukerinteraksjon

### Steg 3: Opprett Client Secret

1. I app-registreringen, gå til **Certificates & secrets**
2. Klikk **New client secret**
3. Fyll inn:
   - **Description**: `DriftPro System Secret`
   - **Expires**: Velg **24 months** (eller lenger hvis tilgjengelig)
4. Klikk **Add**
5. **VIKTIG**: Kopier **Value** (ikke Secret ID) - denne vises bare én gang!
   - Dette er din `GRAPH_CLIENT_SECRET`

### Steg 4: Hent App Credentials

1. I app-registreringen, gå til **Overview**
2. Kopier følgende verdier:
   - **Application (client) ID** → Dette er din `GRAPH_CLIENT_ID`
   - **Directory (tenant) ID** → Dette er din `GRAPH_TENANT_ID`

### Steg 5: Opprett System E-postkonto (Anbefalt)

1. Opprett en dedikert e-postkonto i Microsoft 365:
   - F.eks. `noreply@dittfirma.no` eller `system@dittfirma.no`
   - Eller bruk en delt postboks
2. Dette blir din `GRAPH_SENDER_UPN`

### Steg 6: Konfigurer Miljøvariabler

Legg til følgende i `.env.local` (lokalt) og produksjonsmiljøet:

```bash
# Microsoft Graph App-Only Credentials (PERMANENT TILGANG)
GRAPH_TENANT_ID=din-tenant-id-her
GRAPH_CLIENT_ID=din-client-id-her
GRAPH_CLIENT_SECRET=din-client-secret-her

# System E-postkonto (sender for alle e-poster)
GRAPH_SENDER_UPN=noreply@dittfirma.no
# ELLER
NEXT_PUBLIC_GRAPH_SENDER_EMAIL=noreply@dittfirma.no
```

**VIKTIG**: 
- `GRAPH_CLIENT_SECRET` skal ALDRI committes til git
- Bruk miljøvariabler i produksjon (Netlify, Vercel, etc.)
- For produksjon, sett disse i hosting-plattformens miljøvariabler

### Steg 7: Test Konfigurasjonen

1. Restart development server:
   ```bash
   npm run dev
   ```

2. Test e-post-sending:
   - Systemet vil nå automatisk bruke app-only authentication
   - Ingen brukerinnlogging nødvendig
   - E-poster sendes fra `GRAPH_SENDER_UPN`

3. Test OneDrive-opplasting:
   - Systemet kan nå laste opp filer til OneDrive automatisk
   - Ingen brukerinnlogging nødvendig

## 🔐 Sikkerhet

### Best Practices

1. **Bruk dedikert service account** - Ikke personlige kontoer
2. **Rotér client secrets** - Opprett nytt secret før det utløper
3. **Begrens permissions** - Kun legg til permissions du faktisk trenger
4. **Overvåk bruk** - Sjekk Azure AD logs for uventet aktivitet
5. **Bruk Key Vault i produksjon** - For ekstra sikkerhet

### SPF/DKIM/DMARC Setup (Anbefalt)

For bedre e-post-leveranse, konfigurer:

1. **SPF Record**: Legg til Microsoft 365 i SPF
   ```
   v=spf1 include:spf.protection.outlook.com -all
   ```

2. **DKIM**: Aktiver DKIM i Microsoft 365 Admin Center

3. **DMARC**: Opprett DMARC policy
   ```
   v=DMARC1; p=quarantine; rua=mailto:dmarc@dittfirma.no
   ```

## 📧 Hvordan det fungerer

### E-post-sending

1. Frontend kaller `globalEmailService.sendEmail()`
2. Service kaller `/api/email/send` (backend)
3. Backend henter app-only token via client credentials
4. Backend sender e-post via Microsoft Graph API
5. E-post sendes fra `GRAPH_SENDER_UPN`

**Ingen brukerinnlogging nødvendig!**

### OneDrive-lagring

1. Frontend kaller `oneDriveAppOnlyService.uploadFile()`
2. Service kaller `/api/onedrive/upload` (backend)
3. Backend henter app-only token via client credentials
4. Backend laster opp fil til OneDrive
5. Fil lagres i spesifisert mappestruktur

**Ingen brukerinnlogging nødvendig!**

## 🛠️ API Endpoints

### E-post

- `POST /api/email/send`
  - Body: `{ to, subject, html, text?, fromEmail? }`
  - Bruker automatisk `GRAPH_SENDER_UPN` hvis `fromEmail` ikke er satt

### OneDrive

- `POST /api/onedrive/upload`
  - FormData: `{ file, folderPath, fileName?, userUpn? }`
  
- `GET /api/onedrive/list?folderPath=...&userUpn=...`
  - Lister filer i mappe

- `DELETE /api/onedrive/delete`
  - Body: `{ itemId, userUpn? }`
  - Sletter fil fra OneDrive

## 🔄 Token Refresh

Tokens fornyes automatisk:
- Tokens caches i minnet
- Fornyes 5 minutter før utløp
- Ingen manuell handling nødvendig

## ❌ Feilsøking

### "GRAPH_TENANT_ID, GRAPH_CLIENT_ID eller GRAPH_CLIENT_SECRET mangler"
- Sjekk at alle tre miljøvariabler er satt
- Restart server etter å ha lagt til variabler

### "Fast avsender er ikke konfigurert"
- Sett `GRAPH_SENDER_UPN` eller `NEXT_PUBLIC_GRAPH_SENDER_EMAIL`
- Sjekk at e-postkontoen eksisterer i Microsoft 365

### "Kunne ikke hente app-only token"
- Sjekk at client secret ikke er utløpt
- Verifiser at tenant ID og client ID er riktig
- Sjekk at admin consent er gitt for permissions

### "Insufficient privileges to complete the operation"
- Sjekk at Application permissions (ikke Delegated) er satt
- Verifiser at admin consent er gitt
- Sjekk at permissions matcher det du prøver å gjøre

### E-poster sendes ikke
- Sjekk at `GRAPH_SENDER_UPN` er en gyldig e-postkonto
- Verifiser at kontoen har send-tillatelse
- Sjekk spam/junk-mapper hos mottakere
- Verifiser SPF/DKIM/DMARC er konfigurert

## 📚 Ytterligere Ressurser

- [Microsoft Graph App-Only Authentication](https://learn.microsoft.com/en-us/graph/auth-v2-service)
- [Application Permissions](https://learn.microsoft.com/en-us/graph/permissions-reference)
- [Client Credentials Flow](https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-client-creds-grant-flow)

## ✅ Checklist

- [ ] App registrert i Azure AD
- [ ] Application permissions satt (Mail.Send, Files.ReadWrite.All)
- [ ] Admin consent gitt
- [ ] Client secret opprettet og kopiert
- [ ] Miljøvariabler satt (GRAPH_TENANT_ID, GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET)
- [ ] System e-postkonto opprettet (GRAPH_SENDER_UPN)
- [ ] Server restartet
- [ ] Testet e-post-sending
- [ ] Testet OneDrive-opplasting

## 🎉 Ferdig!

Når dette er satt opp, har systemet permanent tilgang til:
- ✅ E-post-sending (fra alle ansatte og admin)
- ✅ OneDrive-lagring (automatisk)
- ✅ Ingen brukerinnlogging nødvendig
- ✅ Fungerer 24/7 uten avbrudd

