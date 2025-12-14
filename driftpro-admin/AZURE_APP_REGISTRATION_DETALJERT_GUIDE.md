# Detaljert Guide: Azure App Registration for DriftPro E-post

Denne guiden viser deg nøyaktig hvordan du oppretter eller oppdaterer Azure App Registration for at DriftPro skal kunne lese e-poster.

---

## 📋 Forhåndskrav

- Tilgang til Azure Portal (https://portal.azure.com)
- Admin-rettigheter i Microsoft 365/Azure AD organisasjonen
- En Microsoft 365-konto (f.eks. driftpro@mavilogistikk.no eller en admin-konto)

---

## 🎯 Scenario 1: Opprette NY Azure App Registration

### Steg 1: Logg inn på Azure Portal

1. Gå til [https://portal.azure.com](https://portal.azure.com)
2. Logg inn med din Microsoft 365-konto
   - F.eks. `driftpro@mavilogistikk.no` eller din admin-konto

### Steg 2: Naviger til App Registrations

1. I søkefeltet øverst, skriv: **"App registrations"**
2. Klikk på "App registrations" i resultatene

### Steg 3: Opprett ny registrering

1. Klikk på den blå knappen **"+ New registration"** (eller "+ Ny registrering" på norsk)
2. Du får opp et skjema. Fyll ut:

   **Name (Navn):**
   ```
   DriftPro Email Reader
   ```
   
   **Supported account types (Kontotyper som støttes):**
   - Velg: **"Accounts in this organizational directory only"**
     - (På norsk: "Kontoer kun i denne organisasjonskatalogen")
   
   **Redirect URI (Omdirigerings-URI):**
   - Platform: Velg **"Web"** fra nedtrekksmenyen
   - URI: La denne stå **TOM** (ikke nødvendig for app-only access)
   - ELLER legg til: `http://localhost:3000` hvis du vil bruke den senere

3. Klikk på **"Register"** (Registrer) nederst

### Steg 4: Kopier viktig informasjon

Etter registrering ser du en oversiktsside. **KOPIER DISSE MED EN GANG:**

1. **Application (client) ID**
   - Dette er din `GRAPH_CLIENT_ID`
   - Klikk på ikonet ved siden av for å kopiere
   - 💾 **Lagre denne!**

2. **Directory (tenant) ID**
   - Dette er din `GRAPH_TENANT_ID`
   - Klikk på ikonet ved siden av for å kopiere
   - 💾 **Lagre denne!**

---

## 🔐 Steg 5: Opprett Client Secret

1. I venstre meny, klikk på **"Certificates & secrets"** (Sertifikater og hemmeligheter)

2. I "Client secrets" seksjonen, klikk **"+ New client secret"** (+ Ny klienthemmelighet)

3. Fyll ut skjemaet:
   - **Description (Beskrivelse):** 
     ```
     DriftPro Email Reader Secret
     ```
   - **Expires (Utløper):**
     - Velg **"24 months"** (eller lengre hvis mulig)
     - ⚠️ **VIKTIG:** Husk når dette utløper - du må opprette ny før den utløper!

4. Klikk **"Add"** (Legg til)

5. **KRITISK:** Du ser nå "Value" (Verdi) kolonnen
   - 🔴 **Dette vises bare ÉN gang!**
   - Klikk på ikonet ved siden av for å kopiere
   - 💾 **Dette er din `GRAPH_CLIENT_SECRET` - lagre den SIKKERT!**
   - Hvis du mister denne, må du opprette en ny

---

## 🔑 Steg 6: Legg til API Permissions

1. I venstre meny, klikk på **"API permissions"** (API-tillatelser)

2. Du ser nå en liste over permissions. **VIKTIG:** Du trenger **Application permissions**, ikke Delegated!

3. Klikk på **"+ Add a permission"** (+ Legg til en tillatelse)

4. I popup-vinduet:
   - Velg **"Microsoft Graph"**
   - Klikk på den første knappen

5. Nå velger du **"Application permissions"** (IKKE "Delegated permissions")
   - 🔴 **Dette er kritisk forskjell!**

6. I søkefeltet eller listen, finn og merk av for:
   - ✅ **`Mail.Read`** - Les e-postmeldinger
   - ✅ **`Mail.ReadWrite`** - Les og skriv e-postmeldinger (for attachments)
   - ✅ **`User.Read.All`** - Les alle brukeres profilinformasjon (valgfritt, men anbefalt)

7. Når du har valgt, klikk **"Add permissions"** nederst

8. **VIKTIG STE_T:** Du ser nå permissions i listen, men de har en advarsel:
   - Under "Status" står det sannsynligvis: ⚠️ "Not granted for [organisasjon]"
   - Klikk på knappen **"Grant admin consent for [ditt organisasjonsnavn]"**
   - Klikk **"Yes"** i bekreftelsen
   - Nå skal status endres til: ✅ "Granted for [organisasjon]"

---

## 📝 Steg 7: Verifiser konfigurasjonen

Sjekk at alt ser riktig ut:

1. **Overview:**
   - ✅ Application (client) ID - kopiert
   - ✅ Directory (tenant) ID - kopiert

2. **Certificates & secrets:**
   - ✅ Client secret opprettet og verdi kopiert

3. **API permissions:**
   - ✅ Mail.Read - Granted
   - ✅ Mail.ReadWrite - Granted
   - ✅ User.Read.All - Granted (hvis lagt til)
   - ✅ Status viser "Granted for [organisasjon]" (ikke "Not granted")

---

## 🎯 Scenario 2: Oppdatere EKSISTERENDE Azure App Registration

Hvis du allerede har en Azure App (f.eks. "DriftPro Mail App"):

### Steg 1: Finn eksisterende app

1. Gå til [Azure Portal](https://portal.azure.com)
2. Søk etter "App registrations"
3. I listen, finn din eksisterende app (f.eks. "DriftPro Mail App")
4. Klikk på den for å åpne

### Steg 2: Sjekk eksisterende permissions

1. Gå til **"API permissions"**
2. Se på listen:
   - Hvis du ser **"Delegated permissions"** med Mail.Read, Mail.Send, osv.
   - Dette betyr at appen bruker brukerbasert tilgang (ikke app-only)
   - Du må legge til **Application permissions** i tillegg

### Steg 3: Legg til Application permissions

1. Klikk **"+ Add a permission"**
2. Velg **"Microsoft Graph"**
3. **Velg "Application permissions"** (IKKE Delegated!)
4. Legg til:
   - ✅ `Mail.Read`
   - ✅ `Mail.ReadWrite`
5. Klikk **"Add permissions"**
6. **Klikk "Grant admin consent"** for de nye permissions

### Steg 4: Opprett Client Secret (hvis du ikke har en)

1. Gå til **"Certificates & secrets"**
2. Sjekk om du har en aktiv Client Secret:
   - Hvis ja: Kopier verdien (hvis du ikke har den lagret)
   - Hvis nei, eller den er utløpt: Opprett ny (se Scenario 1, Steg 5)

### Steg 5: Kopier informasjon

1. Gå til **"Overview"**
2. Kopier:
   - Application (client) ID → `GRAPH_CLIENT_ID`
   - Directory (tenant) ID → `GRAPH_TENANT_ID`
3. Fra **"Certificates & secrets"**: Client Secret → `GRAPH_CLIENT_SECRET`

---

## ⚙️ Steg 8: Sett miljøvariabler

Nå må du legge til disse i DriftPro:

### Lokalt (.env.local):

```bash
# Microsoft Graph App-Only (for å lese e-poster)
GRAPH_TENANT_ID=din-tenant-id-her
GRAPH_CLIENT_ID=din-client-id-her
GRAPH_CLIENT_SECRET=din-client-secret-her
GRAPH_SENDER_UPN=drifpro@mavilogistikk.no
```

**Eksempel:**
```bash
GRAPH_TENANT_ID=12345678-1234-1234-1234-123456789abc
GRAPH_CLIENT_ID=87654321-4321-4321-4321-cba987654321
GRAPH_CLIENT_SECRET=abc123~XYZ789_SecretValueHere
GRAPH_SENDER_UPN=drifpro@mavilogistikk.no
```

### I produksjon:

Legg til samme variabler i ditt hosting-miljø (Vercel, Netlify, Azure App Service, osv.)

---

## ✅ Steg 9: Test konfigurasjonen

1. **Start serveren på nytt** (hvis lokalt)
   ```bash
   npm run dev
   ```

2. **Test i DriftPro:**
   - Gå til: **Samarbeidspartnere → Ruter Tildelt**
   - Klikk: **"Innkommende ruter fra SAP"**
   - Klikk: **"Oppdater"**
   - Systemet skal nå hente e-poster fra drifpro@mavilogistikk.no

3. **Hvis det fungerer:**
   - ✅ Du skal se e-poster i listen
   - ✅ PDF-vedlegg skal vises (hvis de finnes i e-postene)

4. **Hvis det ikke fungerer:**
   - Sjekk server-loggene for feilmeldinger
   - Se "Troubleshooting" nedenfor

---

## 🐛 Troubleshooting

### Feil: "Microsoft Graph ikke konfigurert"

**Årsak:** Miljøvariabler mangler eller er feil

**Løsning:**
1. Sjekk at alle 4 miljøvariabler er satt:
   - GRAPH_TENANT_ID
   - GRAPH_CLIENT_ID
   - GRAPH_CLIENT_SECRET
   - GRAPH_SENDER_UPN

2. Sjekk at verdiene er kopiert riktig (uten ekstra mellomrom)

3. Start serveren på nytt etter endringer

---

### Feil: "Insufficient privileges" eller "Access denied"

**Årsak:** Admin consent ikke gitt, eller feil type permissions

**Løsning:**
1. Gå til Azure Portal → Din app → API permissions
2. Sjekk at permissions er **"Application permissions"** (ikke Delegated)
3. Sjekk at status viser **"Granted for [organisasjon]"** (ikke "Not granted")
4. Hvis ikke: Klikk "Grant admin consent for [organisasjon]"
5. Vent 1-2 minutter, prøv igjen

---

### Feil: "Invalid client secret"

**Årsak:** Client Secret er utløpt, feil kopiert, eller ikke satt

**Løsning:**
1. Gå til Azure Portal → Din app → Certificates & secrets
2. Sjekk om Client Secret er aktiv (ikke utløpt)
3. Hvis utløpt: Opprett ny og oppdater miljøvariabelen
4. Hvis aktiv: Sjekk at verdien er kopiert riktig i miljøvariabelen
   - Må være eksakt verdi (uten ekstra mellomrom)

---

### Ingen e-poster vises

**Årsak:** Kan være flere ting

**Løsning:**
1. Sjekk at `drifpro@mavilogistikk.no` eksisterer i Microsoft 365
2. Sjekk at det faktisk er e-poster i postboksen
3. Sjekk server-loggene for feilmeldinger
4. Prøv å sende en test-e-post til driftpro@mavilogistikk.no
5. Vent et par minutter, klikk "Oppdater" igjen

---

### "AADSTS700016: Application was not found"

**Årsak:** Client ID eller Tenant ID er feil

**Løsning:**
1. Gå til Azure Portal → Din app → Overview
2. Kopier Application (client) ID og Directory (tenant) ID på nytt
3. Sjekk at de er riktig satt i miljøvariablene
4. Start serveren på nytt

---

## 🔒 Sikkerhetstips

1. **Ikke del Client Secret:**
   - Aldri commit til GitHub/GitLab
   - Bruk `.env.local` (som er i .gitignore)
   - I produksjon: Bruk miljøvariabler i hosting-plattformen

2. **Roterer Client Secrets:**
   - Opprett ny Client Secret hver 12-24 måned
   - Oppdater miljøvariabelen før den gamle utløper

3. **Minimalt sett permissions:**
   - Legg bare til permissions du faktisk trenger
   - Mail.Read og Mail.ReadWrite er nok for e-postlesing

---

## 📞 Trenger du hjelp?

Hvis du fortsatt har problemer:

1. Sjekk Azure Portal → Din app → Overview → Logs (for feil)
2. Sjekk server-loggene i DriftPro
3. Verifiser at alle steg over er fulgt nøyaktig

---

## 📚 Ytterligere ressurser

- [Microsoft Graph API Documentation](https://docs.microsoft.com/en-us/graph/)
- [Azure App Registration Overview](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)


