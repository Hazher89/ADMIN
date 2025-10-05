# OneDrive Setup Guide for DriftPro

## Oppdatert løsning ✅

OneDrive bruker nå samme Azure app som mail-funksjonen. Du trenger bare å legge til OneDrive-permissions til den eksisterende Azure app-en.

## Løsning: Legg til OneDrive permissions til eksisterende Azure App

### Steg 1: Gå til Azure Portal
1. Gå til [Azure Portal](https://portal.azure.com)
2. Logg inn med `driftpro@mavilogistikk.no`
3. Søk etter "App registrations" i søkefeltet

### Steg 2: Finn eksisterende DriftPro Mail App
1. Finn "DriftPro Mail App" i listen over app registrations
2. Klikk på den for å åpne konfigurasjonen

### Steg 3: Legg til ekstra Redirect URIs (hvis nødvendig)
1. Gå til "Authentication" i venstre meny
2. Sjekk at disse Redirect URIs er lagt til:
   - `https://admin.driftpro.no` (produksjon)
   - `http://localhost:3000` (lokal utvikling)
3. Legg til manglende URIs hvis nødvendig

### Steg 4: Konfigurer API Permissions for OneDrive
1. Gå til "API permissions" i venstre meny
2. Klikk "Add a permission"
3. Velg "Microsoft Graph"
4. Velg "Delegated permissions"
5. Legg til disse OneDrive permissions (i tillegg til de eksisterende mail permissions):
   - `Files.ReadWrite`
   - `Files.ReadWrite.All`
   - `Sites.ReadWrite.All`
6. Klikk "Add permissions"
7. Klikk "Grant admin consent for MAVI Logistikk AS"

### Steg 5: Sjekk eksisterende Client ID
1. Gå til "Overview" i venstre meny
2. Bekreft at "Application (client) ID" er riktig (den samme som brukes for mail-funksjonen)

### Steg 6: Verifiser miljøvariabler
Siden OneDrive nå bruker samme Azure app som mail-funksjonen, sjekk at disse miljøvariablene er satt:
```bash
NEXT_PUBLIC_MICROSOFT_CLIENT_ID=din-riktige-client-id-her
NEXT_PUBLIC_MICROSOFT_TENANT_ID=din-tenant-id-her
NEXT_PUBLIC_MICROSOFT_REDIRECT_URI=https://admin.driftpro.no
```

### Steg 7: Deploy til produksjon
1. Deploy appen til `admin.driftpro.no`
2. Sørg for at miljøvariablene er satt på serveren
3. Test OneDrive-integrasjonen på den live siden

## Oppdatert konfigurasjon ✅

OneDrive bruker nå samme Azure app som mail-funksjonen, så du trenger bare å:
1. Legge til OneDrive permissions til den eksisterende Azure app-en
2. Bekrefte at miljøvariablene for Microsoft Graph er riktig konfigurert

## Test OneDrive-integrasjonen

1. Gå til Arkiv-siden i DriftPro
2. Klikk "Logg inn med Office 365"
3. Du skal nå kunne logge inn med `driftpro@mavilogistikk.no`
4. Etter innlogging kan du søke og administrere filer i OneDrive

## Feilsøking

### Hvis du fortsatt får feil:
1. Sjekk at `NEXT_PUBLIC_MICROSOFT_CLIENT_ID` er riktig i miljøvariablene
2. Sjekk at alle OneDrive API permissions er lagt til og godkjent
3. Sjekk at Redirect URI matcher nøyaktig
4. Prøv å logge ut og inn igjen

### Hvis du får "Insufficient privileges":
1. Gå til Azure Portal → App registrations → DriftPro Mail App
2. Gå til "API permissions"
3. Sjekk at OneDrive permissions er lagt til:
   - `Files.ReadWrite`
   - `Files.ReadWrite.All`
   - `Sites.ReadWrite.All`
4. Klikk "Grant admin consent for MAVI Logistikk AS"

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