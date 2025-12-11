# 🚀 STEP-BY-STEP GUIDE: Permanent Tilgang til E-post og OneDrive

## 📋 OVERSIKT
Dette gir systemet **permanent tilgang** til:
- ✅ E-post-sending (fra alle ansatte og admin)
- ✅ OneDrive-lagring (automatisk)
- ✅ **INGEN brukerinnlogging nødvendig**

---

## STEG 1: Gå til Azure Portal

1. Åpne nettleser og gå til: **https://portal.azure.com**
2. Logg inn med din Microsoft 365 administrator-konto
3. Du skal nå se Azure Portal dashboard

---

## STEG 2: Opprett App Registration

1. I søkefeltet øverst, skriv: **"Azure Active Directory"**
2. Klikk på **"Azure Active Directory"** fra resultatene
3. I venstre meny, klikk på **"App registrations"**
4. Klikk på **"+ New registration"** (blå knapp øverst)

### Fyll inn skjemaet:

- **Name**: `DriftPro System Service`
- **Supported account types**: Velg **"Accounts in this organizational directory only (Single tenant)"**
- **Redirect URI**: 
  - La stå tom (ikke nødvendig for app-only authentication)
  - ELLER hvis du må velge: Velg **"Web"** og skriv: `https://admin.driftpro.no`

5. Klikk **"Register"** (blå knapp nederst)

### ✅ Du skal nå se:
- **Overview**-siden for din nye app
- **Application (client) ID** - KOPIER DENNE! (trenger den senere)
- **Directory (tenant) ID** - KOPIER DENNE! (trenger den senere)

---

## STEG 3: Sett Application Permissions

1. I venstre meny, klikk på **"API permissions"**
2. Klikk på **"+ Add a permission"** (blå knapp)
3. Velg **"Microsoft Graph"**
4. **VIKTIG**: Velg **"Application permissions"** (IKKE "Delegated permissions"!)
5. I søkefeltet, søk etter og huk av for:

### ✅ Legg til disse permissions:

- **Mail.Send** 
  - Søk: `Mail.Send`
  - Huk av boksen
  - Beskrivelse: "Send mail as any user"

- **Files.ReadWrite.All**
  - Søk: `Files.ReadWrite.All`
  - Huk av boksen
  - Beskrivelse: "Have full access to all files user can access"

6. Klikk **"Add permissions"** (blå knapp nederst)

### ✅ Du skal nå se:
- To permissions i listen under "Application permissions"

---

## STEG 4: Gi Admin Consent (KRITISK!)

1. Du skal fortsatt være på **"API permissions"**-siden
2. Se etter en gul advarsel-banner som sier noe om "Admin consent required"
3. Klikk på **"Grant admin consent for [ditt firma navn]"** (blå knapp)
4. Bekreft ved å klikke **"Yes"** i popup-vinduet

### ✅ Du skal nå se:
- Status endres fra rød/gul til grønn ✅
- "Granted for [ditt firma]" under hver permission
- Ingen advarsler lenger

**⚠️ VIKTIG**: Uten admin consent fungerer ingenting!

---

## STEG 5: Opprett Client Secret

1. I venstre meny, klikk på **"Certificates & secrets"**
2. Klikk på **"+ New client secret"** (blå knapp)
3. Fyll inn:
   - **Description**: `DriftPro System Secret`
   - **Expires**: Velg **"24 months"** (eller lengst mulig)
4. Klikk **"Add"** (blå knapp)

### ✅ Du skal nå se:
- En ny secret i listen
- **Value**-kolonnen viser en lang tekststreng
- **⚠️ KRITISK**: Klikk på **kopier-ikonet** (to dokumenter) ved siden av "Value"
- **⚠️ VIKTIG**: Denne vises bare EN GANG! Lagre den trygt.

### 📝 Skriv ned:
- **Client Secret Value**: `[den lange teksten du nettopp kopierte]`

---

## STEG 6: Hent alle Credentials

1. Gå tilbake til **"Overview"** i venstre meny
2. Du skal nå se alle verdiene du trenger

### 📝 Skriv ned alle disse:

- **Application (client) ID**: `[kopier denne]`
- **Directory (tenant) ID**: `[kopier denne]`
- **Client Secret Value**: `[fra steg 5]`

---

## STEG 7: Verifiser System E-postkonto

✅ **Du har allerede**: `driftpro@mavilogistikk.no`

**Verifiser at kontoen eksisterer:**
1. Gå til **Microsoft 365 Admin Center**: https://admin.microsoft.com
2. Gå til **"Users"** > **"Active users"**
3. Søk etter: `driftpro@mavilogistikk.no`
4. Bekreft at kontoen er aktiv og har lisens

**Hvis kontoen ikke eksisterer**, opprett den:
1. Klikk **"+ Add a user"**
2. Username: `driftpro` (blir `driftpro@mavilogistikk.no`)
3. Tildel lisens: **Microsoft 365 Business Basic** eller høyere
4. Klikk **"Add"**

### 📝 Bekreft:
- **E-postadresse**: `driftpro@mavilogistikk.no`
- Dette blir din `GRAPH_SENDER_UPN`

---

## STEG 8: Sett Miljøvariabler Lokalt

1. Åpne prosjektet i din editor (VS Code, etc.)
2. Finn filen `.env.local` i rotmappen
   - Hvis den ikke finnes, opprett den
3. Legg til følgende linjer:

```bash
# Microsoft Graph App-Only (PERMANENT TILGANG)
GRAPH_TENANT_ID=din-tenant-id-her
GRAPH_CLIENT_ID=din-client-id-her
GRAPH_CLIENT_SECRET=din-client-secret-her
GRAPH_SENDER_UPN=driftpro@mavilogistikk.no
```

### Eksempel (erstatt med dine verdier):

```bash
GRAPH_TENANT_ID=15dd624a-cc33-4240-a6d5-8bc6797ae68c
GRAPH_CLIENT_ID=4c0621e5-8bd6-479f-8833-fb480ad527d7
GRAPH_CLIENT_SECRET=abc123~DEF456~ghi789~JKL012~mno345
GRAPH_SENDER_UPN=driftpro@mavilogistikk.no

4. Lagre filen

**⚠️ VIKTIG**: 
- `.env.local` skal ALDRI committes til git (er allerede i .gitignore)
- Ikke del disse verdiene med noen

---

## STEG 9: Sett Miljøvariabler i Produksjon (Netlify for admin.driftpro.no)

### Netlify Setup:

1. Gå til **Netlify Dashboard**: https://app.netlify.com
2. Velg ditt prosjekt (admin.driftpro.no)
3. Gå til **"Site settings"** > **"Environment variables"**
4. Klikk **"Add variable"** for hver:
   - `GRAPH_TENANT_ID` = `15dd624a-cc33-4240-a6d5-8bc6797ae68c`
   - `GRAPH_CLIENT_ID` = `4c0621e5-8bd6-479f-8833-fb480ad527d7`
   - `GRAPH_CLIENT_SECRET` = [din client secret fra steg 3]
   - `GRAPH_SENDER_UPN` = [din e-postadresse, f.eks. noreply@driftpro.no]
5. **VIKTIG**: Klikk **"Save"** for hver variabel
6. **VIKTIG**: Trigger en ny deploy for at endringene skal tre i kraft

### Hvis du bruker Vercel:

1. Gå til Vercel Dashboard
2. Velg ditt prosjekt
3. Gå til **"Settings"** > **"Environment Variables"**
4. Legg til samme variabler som over

### Hvis du bruker annen hosting:

- Finn hvor du setter miljøvariabler i din hosting-plattform
- Legg til de samme 4 variablene

---

## STEG 10: Restart Server

1. Stopp development serveren (Ctrl+C i terminalen)
2. Start den på nytt:

```bash
npm run dev
```

3. Vent til serveren starter

---

## STEG 11: Test E-post-sending

1. Åpne appen i nettleseren
2. Gå til en side som sender e-post (f.eks. opprett ny ansatt)
3. Prøv å sende en e-post
4. Sjekk konsollen (F12 > Console) for meldinger

### ✅ Du skal se:
- `✅ E-post sendt via app-only API (permanent tilgang)`
- Ingen feilmeldinger

### ❌ Hvis du ser feil:
- Sjekk at alle miljøvariabler er satt riktig
- Sjekk at admin consent er gitt (steg 4)
- Sjekk at client secret ikke er utløpt

---

## STEG 12: Test OneDrive-opplasting

1. Gå til dokument-siden i appen
2. Prøv å laste opp et dokument
3. Sjekk konsollen for meldinger

### ✅ Du skal se:
- `📁 Uploading to OneDrive (app-only)...`
- `✅ File uploaded to OneDrive: [filnavn]`

### ❌ Hvis du ser feil:
- Sjekk at `Files.ReadWrite.All` permission er satt
- Sjekk at admin consent er gitt
- Sjekk at `GRAPH_SENDER_UPN` er en gyldig e-postkonto

---

## ✅ CHECKLIST - Sjekk at alt er gjort:

- [ ] App registrert i Azure Portal
- [ ] Application permissions satt (Mail.Send, Files.ReadWrite.All)
- [ ] Admin consent gitt (grønn status)
- [ ] Client secret opprettet og kopiert
- [ ] Alle credentials skrevet ned
- [x] System e-postkonto eksisterer (`driftpro@mavilogistikk.no`)
- [ ] Miljøvariabler satt lokalt (.env.local)
- [ ] Miljøvariabler satt i produksjon
- [ ] Server restartet
- [ ] E-post-sending testet og fungerer
- [ ] OneDrive-opplasting testet og fungerer

---

## 🆘 FEILSØKING

### "GRAPH_TENANT_ID, GRAPH_CLIENT_ID eller GRAPH_CLIENT_SECRET mangler"

**Løsning:**
- Sjekk at alle tre er i `.env.local`
- Sjekk at det ikke er mellomrom eller anførselstegn
- Restart serveren

### "Fast avsender er ikke konfigurert"

**Løsning:**
- Sjekk at `GRAPH_SENDER_UPN` er satt
- Sjekk at e-postkontoen eksisterer i Microsoft 365
- Sjekk at e-postadressen er riktig formatert (f.eks. `noreply@firma.no`)

### "Kunne ikke hente app-only token"

**Løsning:**
- Sjekk at tenant ID og client ID er riktig kopiert
- Sjekk at client secret ikke er utløpt
- Sjekk at det ikke er ekstra mellomrom i verdiene

### "Insufficient privileges to complete the operation"

**Løsning:**
- Sjekk at du har satt **Application permissions** (ikke Delegated)
- Sjekk at admin consent er gitt (steg 4)
- Vent 5-10 minutter og prøv igjen (kan ta tid å propagere)

### "OneDrive upload failed"

**Løsning:**
- Sjekk at `Files.ReadWrite.All` permission er satt
- Sjekk at admin consent er gitt
- Sjekk at `GRAPH_SENDER_UPN` har OneDrive tilgjengelig

---

## 🎉 FERDIG!

Når alle stegene er fullført, har systemet:
- ✅ Permanent tilgang til e-post (ingen innlogging nødvendig)
- ✅ Permanent tilgang til OneDrive (ingen innlogging nødvendig)
- ✅ Fungerer 24/7 uten avbrudd
- ✅ Automatisk token refresh

**Systemet er nå klart til produksjon!** 🚀

---

## 📞 Trenger du hjelp?

1. Sjekk konsollen for feilmeldinger
2. Sjekk at alle miljøvariabler er satt
3. Verifiser at admin consent er gitt i Azure Portal
4. Sjekk at permissions er riktig satt (Application, ikke Delegated)
