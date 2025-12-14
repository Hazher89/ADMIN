# Produksjon Setup for admin.driftpro.no

Denne guiden viser deg hvordan du setter opp alt for produksjon på **admin.driftpro.no**.

---

## 📋 Oversikt

For at e-postlesing skal fungere på **admin.driftpro.no**, må du:

1. ✅ Legge til Mail.Read permissions i Azure (allerede forklart)
2. ✅ Oppdatere Redirect URI i Azure til produksjons-URL
3. ✅ Sette miljøvariabler i Netlify (eller ditt hosting-miljø)
4. ✅ Teste at alt fungerer

---

## 🔧 Steg 1: Oppdater Redirect URI i Azure

Hvis du bruker delegated permissions (for mail-siden), må du legge til produksjons-URL:

1. Gå til [Azure Portal](https://portal.azure.com)
2. Søk etter "App registrations"
3. Klikk på din app (f.eks. "DriftPro Mail App")
4. Gå til **"Authentication"** i venstre meny
5. Under "Redirect URIs", legg til:
   - ✅ `https://admin.driftpro.no/dashboard/mail`
   - ✅ `https://admin.driftpro.no/dashboard/email-system`
6. Klikk **"Save"**

**Merk:** For app-only permissions (Mail.Read, Mail.Send) trenger du ikke redirect URI, men det er greit å ha den hvis du også bruker delegated permissions.

---

## 🌐 Steg 2: Sett miljøvariabler i Netlify

Hvis du bruker Netlify for hosting:

### Metode 1: Via Netlify Dashboard (Anbefalt)

1. Gå til [Netlify Dashboard](https://app.netlify.com)
2. Velg ditt site (admin.driftpro.no)
3. Gå til **"Site settings"** → **"Environment variables"**
4. Klikk **"Add variable"** og legg til hver variabel:

```bash
# Microsoft Graph App-Only (for å lese e-poster)
GRAPH_TENANT_ID=din-tenant-id-her
GRAPH_CLIENT_ID=din-client-id-her
GRAPH_CLIENT_SECRET=din-client-secret-her
GRAPH_SENDER_UPN=drifpro@mavilogistikk.no

# Microsoft Graph Delegated (for mail-siden, hvis du bruker den)
NEXT_PUBLIC_MICROSOFT_CLIENT_ID=din-client-id-her
NEXT_PUBLIC_MICROSOFT_TENANT_ID=din-tenant-id-her
NEXT_PUBLIC_MICROSOFT_REDIRECT_URI=https://admin.driftpro.no/dashboard/mail
```

5. Klikk **"Save"** for hver variabel

### Metode 2: Via Netlify CLI

```bash
# Installer Netlify CLI hvis du ikke har det
npm install -g netlify-cli

# Login
netlify login

# Sett variabler
netlify env:set GRAPH_TENANT_ID "din-tenant-id"
netlify env:set GRAPH_CLIENT_ID "din-client-id"
netlify env:set GRAPH_CLIENT_SECRET "din-client-secret"
netlify env:set GRAPH_SENDER_UPN "drifpro@mavilogistikk.no"
netlify env:set NEXT_PUBLIC_MICROSOFT_CLIENT_ID "din-client-id"
netlify env:set NEXT_PUBLIC_MICROSOFT_TENANT_ID "din-tenant-id"
netlify env:set NEXT_PUBLIC_MICROSOFT_REDIRECT_URI "https://admin.driftpro.no/dashboard/mail"
```

---

## 🚀 Steg 3: Redeploy etter endringer

Etter at du har satt miljøvariablene:

1. **I Netlify Dashboard:**
   - Gå til "Deploys"
   - Klikk "Trigger deploy" → "Deploy site"
   - Eller push en commit til GitHub (hvis auto-deploy er aktivert)

2. **Vent på at deploy er ferdig** (vanligvis 2-5 minutter)

3. **Test:**
   - Gå til https://admin.driftpro.no
   - Logg inn
   - Gå til: **Samarbeidspartnere → Ruter Tildelt**
   - Klikk: **"Innkommende ruter fra SAP"**
   - Klikk: **"Oppdater"**
   - Systemet skal nå hente e-poster!

---

## 🔍 Steg 4: Verifiser at alt fungerer

### Test 1: Sjekk miljøvariabler

1. Gå til Netlify Dashboard → Site settings → Environment variables
2. Verifiser at alle variabler er satt:
   - ✅ GRAPH_TENANT_ID
   - ✅ GRAPH_CLIENT_ID
   - ✅ GRAPH_CLIENT_SECRET
   - ✅ GRAPH_SENDER_UPN

### Test 2: Test e-postlesing

1. Send en test-e-post til `drifpro@mavilogistikk.no` med PDF-vedlegg
2. Vent 1-2 minutter
3. Gå til DriftPro → Samarbeidspartnere → Ruter Tildelt
4. Klikk "Innkommende ruter fra SAP"
5. Klikk "Oppdater"
6. Du skal se e-posten i listen!

### Test 3: Sjekk server-loggene

1. I Netlify Dashboard, gå til "Functions" → "Logs"
2. Se etter feilmeldinger når du klikker "Oppdater"
3. Hvis det er feil, sjekk:
   - At miljøvariablene er riktig
   - At Azure permissions er gitt (Mail.Read, Mail.ReadWrite)
   - At Client Secret ikke er utløpt

---

## 🐛 Troubleshooting for produksjon

### Feil: "Microsoft Graph ikke konfigurert"

**Årsak:** Miljøvariabler mangler i Netlify

**Løsning:**
1. Gå til Netlify Dashboard → Site settings → Environment variables
2. Sjekk at alle 4 variabler er satt:
   - GRAPH_TENANT_ID
   - GRAPH_CLIENT_ID
   - GRAPH_CLIENT_SECRET
   - GRAPH_SENDER_UPN
3. Redeploy site

---

### Feil: "Insufficient privileges"

**Årsak:** Admin consent ikke gitt i Azure

**Løsning:**
1. Gå til Azure Portal → Din app → API permissions
2. Sjekk at Mail.Read og Mail.ReadWrite har status "Granted for MAVI Logistikk AS"
3. Hvis ikke: Klikk "Grant admin consent"
4. Vent 1-2 minutter, test igjen

---

### Feil: "Invalid redirect URI"

**Årsak:** Redirect URI ikke lagt til i Azure

**Løsning:**
1. Gå til Azure Portal → Din app → Authentication
2. Legg til: `https://admin.driftpro.no/dashboard/mail`
3. Klikk "Save"
4. Test igjen

---

### Ingen e-poster vises

**Årsak:** Kan være flere ting

**Løsning:**
1. Sjekk at e-poster faktisk er sendt til driftpro@mavilogistikk.no
2. Sjekk Netlify Functions logs for feilmeldinger
3. Sjekk at miljøvariablene er satt riktig (uten ekstra mellomrom)
4. Sjekk at Client Secret ikke er utløpt
5. Prøv å redeploy site

---

## 📝 Checklist for produksjon

Før du går live, sjekk at:

- [ ] Mail.Read og Mail.ReadWrite er lagt til som **Application permissions** i Azure
- [ ] Admin consent er gitt for Mail.Read og Mail.ReadWrite
- [ ] Client Secret er opprettet og kopiert
- [ ] Alle miljøvariabler er satt i Netlify:
  - [ ] GRAPH_TENANT_ID
  - [ ] GRAPH_CLIENT_ID
  - [ ] GRAPH_CLIENT_SECRET
  - [ ] GRAPH_SENDER_UPN
- [ ] Redirect URI er lagt til i Azure: `https://admin.driftpro.no/dashboard/mail`
- [ ] Site er redeployed etter endringer
- [ ] Test-e-post er sendt og kan hentes i DriftPro

---

## 🔒 Sikkerhet i produksjon

1. **Ikke commit miljøvariabler:**
   - Sjekk at `.env.local` er i `.gitignore`
   - Bruk alltid Netlify Environment Variables (ikke hardcode)

2. **Roterer Client Secrets:**
   - Opprett ny Client Secret hver 12-24 måned
   - Oppdater i Netlify før den gamle utløper

3. **Monitorer logs:**
   - Sjekk Netlify Functions logs regelmessig
   - Sett opp alerts for kritiske feil

---

## 📞 Hvis du trenger hjelp

1. Sjekk Netlify Functions logs for feilmeldinger
2. Sjekk Azure Portal → Din app → Logs
3. Verifiser at alle steg over er fulgt

---

## 🎯 Neste steg

Når alt er konfigurert:

1. ✅ Send test-e-post til driftpro@mavilogistikk.no
2. ✅ Gå til DriftPro → Samarbeidspartnere → Ruter Tildelt
3. ✅ Klikk "Innkommende ruter fra SAP"
4. ✅ Klikk "Oppdater"
5. ✅ E-posten skal vises i listen!


