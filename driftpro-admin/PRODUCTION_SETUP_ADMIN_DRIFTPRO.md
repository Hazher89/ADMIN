# 🚀 PRODUKSJON SETUP - admin.driftpro.no

## ✅ Dine Azure Credentials (Allerede opprettet)

```
Tenant ID: 15dd624a-cc33-4240-a6d5-8bc6797ae68c
Client ID: 4c0621e5-8bd6-479f-8833-fb480ad527d7
```

## 📋 Hva du mangler

1. **Client Secret** - Hent fra Azure Portal (Certificates & secrets)
2. ✅ **E-postadresse** - Du har allerede `driftpro@mavilogistikk.no`

---

## 🔧 STEG 1: Hent Client Secret

1. Gå til Azure Portal: https://portal.azure.com
2. Søk: **"Azure Active Directory"** → **"App registrations"**
3. Klikk på appen: **"DriftPro System Service"**
4. Gå til: **"Certificates & secrets"**
5. Hvis du ikke har opprettet secret ennå:
   - Klikk: **"+ New client secret"**
   - Description: `DriftPro Production Secret`
   - Expires: **24 months**
   - Klikk: **"Add"**
6. **KOPIER "Value"** (vises bare én gang!)

---

## 📧 STEG 2: Verifiser System E-postkonto

✅ **Du har allerede**: `driftpro@mavilogistikk.no`

**Verifiser at kontoen eksisterer:**
1. Gå til: https://admin.microsoft.com
2. **"Users"** → Søk etter: `driftpro@mavilogistikk.no`
3. Bekreft at kontoen er aktiv og har lisens

**Hvis kontoen ikke eksisterer**, opprett den:
1. **"Users"** → **"+ Add a user"**
2. Username: `driftpro` (blir `driftpro@mavilogistikk.no`)
3. Tildel lisens: **Microsoft 365 Business Basic** eller høyere

---

## 🌐 STEG 3: Sett Miljøvariabler i Netlify

1. Gå til: https://app.netlify.com
2. Velg ditt prosjekt (admin.driftpro.no)
3. Gå til: **"Site settings"** (venstre meny)
4. Klikk: **"Environment variables"**
5. Legg til hver variabel:

### Variabel 1: GRAPH_TENANT_ID
- **Key**: `GRAPH_TENANT_ID`
- **Value**: `15dd624a-cc33-4240-a6d5-8bc6797ae68c`
- **Scopes**: Production, Deploy previews, Branch deploys
- Klikk: **"Add variable"**

### Variabel 2: GRAPH_CLIENT_ID
- **Key**: `GRAPH_CLIENT_ID`
- **Value**: `4c0621e5-8bd6-479f-8833-fb480ad527d7`
- **Scopes**: Production, Deploy previews, Branch deploys
- Klikk: **"Add variable"**

### Variabel 3: GRAPH_CLIENT_SECRET
- **Key**: `GRAPH_CLIENT_SECRET`
- **Value**: `[din client secret fra steg 1]`
- **Scopes**: Production, Deploy previews, Branch deploys
- Klikk: **"Add variable"**

### Variabel 4: GRAPH_SENDER_UPN
- **Key**: `GRAPH_SENDER_UPN`
- **Value**: `driftpro@mavilogistikk.no`
- **Scopes**: Production, Deploy previews, Branch deploys
- Klikk: **"Add variable"**

---

## 🔄 STEG 4: Trigger Ny Deploy

1. I Netlify Dashboard, gå til: **"Deploys"**
2. Klikk: **"Trigger deploy"** → **"Deploy site"**
3. Vent til deploy er ferdig (2-3 minutter)

**Alternativt**: Push en liten endring til git for å trigge automatisk deploy.

---

## ✅ STEG 5: Verifiser Permissions i Azure Portal

Sjekk at alt er riktig konfigurert:

1. Gå til Azure Portal
2. **"App registrations"** → **"DriftPro System Service"**
3. Gå til: **"API permissions"**
4. Verifiser at du har:
   - ✅ `Mail.Send` (Application permission)
   - ✅ `Files.ReadWrite.All` (Application permission)
   - ✅ **"Granted for [ditt firma]"** (grønn status)
   - ✅ **Admin consent gitt**

Hvis noe mangler, se `SETUP_GUIDE_STEP_BY_STEP.md` steg 3-4.

---

## 🧪 STEG 6: Test i Produksjon

1. Gå til: https://admin.driftpro.no
2. Logg inn
3. Prøv å:
   - Sende en e-post (f.eks. opprett ny ansatt)
   - Laste opp et dokument
4. Sjekk konsollen (F12) for meldinger:
   - ✅ `E-post sendt via app-only API (permanent tilgang)`
   - ✅ `File uploaded to OneDrive (app-only)`

---

## 📝 Lokal Utvikling (.env.local)

For lokal utvikling, legg til i `.env.local`:

```bash
# Microsoft Graph App-Only (PERMANENT TILGANG)
GRAPH_TENANT_ID=15dd624a-cc33-4240-a6d5-8bc6797ae68c
GRAPH_CLIENT_ID=4c0621e5-8bd6-479f-8833-fb480ad527d7
GRAPH_CLIENT_SECRET=[samme som i Netlify]
GRAPH_SENDER_UPN=driftpro@mavilogistikk.no
```

---

## ✅ CHECKLIST

- [ ] Client Secret hentet fra Azure Portal
- [x] System e-postkonto eksisterer (`driftpro@mavilogistikk.no`)
- [ ] GRAPH_TENANT_ID satt i Netlify
- [ ] GRAPH_CLIENT_ID satt i Netlify
- [ ] GRAPH_CLIENT_SECRET satt i Netlify
- [ ] GRAPH_SENDER_UPN satt i Netlify (`driftpro@mavilogistikk.no`)
- [ ] Ny deploy trigget i Netlify
- [ ] Permissions verifisert i Azure Portal
- [ ] Testet e-post-sending i produksjon
- [ ] Testet dokument-opplasting i produksjon

---

## 🆘 Feilsøking

### "GRAPH_TENANT_ID, GRAPH_CLIENT_ID eller GRAPH_CLIENT_SECRET mangler"

**Løsning:**
- Sjekk at alle variabler er satt i Netlify
- Sjekk at du har valgt riktig scope (Production)
- Trigger ny deploy

### "Fast avsender er ikke konfigurert"

**Løsning:**
- Sjekk at `GRAPH_SENDER_UPN` er satt i Netlify
- Sjekk at e-postkontoen eksisterer i Microsoft 365
- Verifiser at e-postadressen er riktig formatert

### E-poster sendes ikke

**Løsning:**
- Sjekk at admin consent er gitt i Azure Portal
- Sjekk at `Mail.Send` permission er satt (Application, ikke Delegated)
- Vent 5-10 minutter og prøv igjen (kan ta tid å propagere)

---

## 🎉 FERDIG!

Når alt er satt opp, har **admin.driftpro.no** permanent tilgang til:
- ✅ E-post-sending (ingen innlogging nødvendig)
- ✅ OneDrive-lagring (automatisk)
- ✅ Fungerer 24/7
