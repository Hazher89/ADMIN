# OneDrive Setup Guide for DriftPro

## Problem løst ✅

Feilen du så var:
```
AADSTS700016: Application with identifier 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' was not found in the directory 'MAVI Logistikk AS'
```

Dette skjedde fordi placeholder Client ID ikke var registrert i din Azure AD-tenant.

## Løsning: Opprett riktig Azure App Registration

### Steg 1: Gå til Azure Portal
1. Gå til [Azure Portal](https://portal.azure.com)
2. Logg inn med `driftpro@mavilogistikk.no`
3. Søk etter "App registrations" i søkefeltet

### Steg 2: Opprett ny App Registration
1. Klikk "New registration"
2. Fyll ut:
   - **Name**: `DriftPro OneDrive Integration`
   - **Supported account types**: `Accounts in this organizational directory only (MAVI Logistikk AS only - Single tenant)`
   - **Redirect URI**: `Web` → `https://admin.driftpro.no`
3. Klikk "Register"

### Steg 2.5: Legg til ekstra Redirect URIs (Viktig!)
1. Gå til "Authentication" i venstre meny
2. Legg til disse Redirect URIs:
   - `https://admin.driftpro.no` (produksjon)
   - `http://localhost:3000` (lokal utvikling)

### Steg 3: Konfigurer API Permissions
1. Gå til "API permissions" i venstre meny
2. Klikk "Add a permission"
3. Velg "Microsoft Graph"
4. Velg "Delegated permissions"
5. Legg til disse permissions:
   - `User.Read`
   - `Files.ReadWrite`
   - `Files.ReadWrite.All`
   - `Sites.ReadWrite.All`
6. Klikk "Add permissions"
7. Klikk "Grant admin consent for MAVI Logistikk AS"

### Steg 4: Hent Client ID
1. Gå til "Overview" i venstre meny
2. Kopier "Application (client) ID" (det ser ut som: `12345678-1234-1234-1234-123456789012`)

### Steg 5: Konfigurer miljøvariabel
1. Opprett/rediger `.env.local` filen i prosjektet
2. Legg til:
```bash
NEXT_PUBLIC_ONEDRIVE_CLIENT_ID=din-riktige-client-id-her
```

### Steg 6: Deploy til produksjon
1. Deploy appen til `admin.driftpro.no`
2. Sørg for at miljøvariabelen er satt på serveren
3. Test OneDrive-integrasjonen på den live siden

## Alternativ: Bruk Multi-tenant App

Hvis du vil at andre bedrifter også skal kunne bruke appen:

### Steg 1: Opprett Multi-tenant App
1. I Azure Portal, velg "App registrations"
2. Klikk "New registration"
3. Fyll ut:
   - **Name**: `DriftPro OneDrive Integration`
   - **Supported account types**: `Accounts in any organizational directory (Any Azure AD directory - Multitenant) and personal Microsoft accounts`
   - **Redirect URI**: `Web` → `https://admin.driftpro.no`

### Steg 2: Konfigurer Redirect URIs (Viktig!)
1. Gå til "Authentication" i venstre meny
2. Legg til disse Redirect URIs:
   - `https://admin.driftpro.no` (produksjon)
   - `http://localhost:3000` (lokal utvikling)
3. Under "Advanced settings":
   - **Allow public client flows**: `Yes`

## Test OneDrive-integrasjonen

1. Gå til Arkiv-siden i DriftPro
2. Klikk "Logg inn med Office 365"
3. Du skal nå kunne logge inn med `driftpro@mavilogistikk.no`
4. Etter innlogging kan du søke og administrere filer i OneDrive

## Feilsøking

### Hvis du fortsatt får feil:
1. Sjekk at Client ID er riktig i `.env.local`
2. Sjekk at alle API permissions er godkjent
3. Sjekk at Redirect URI matcher nøyaktig
4. Prøv å logge ut og inn igjen

### Hvis du får "Insufficient privileges":
1. Gå til Azure Portal → App registrations → Din app
2. Gå til "API permissions"
3. Klikk "Grant admin consent for MAVI Logistikk AS"

## Sikkerhet

- Client ID kan være synlig i frontend (det er OK)
- Bruk alltid HTTPS i produksjon
- Begrens API permissions til minimum nødvendig
- Vurder å bruke Certificate-based authentication for produksjon

## Support

Hvis du trenger hjelp:
1. Sjekk Azure Portal for feilmeldinger
2. Se browser console for detaljerte feil
3. Kontakt Microsoft support hvis nødvendig