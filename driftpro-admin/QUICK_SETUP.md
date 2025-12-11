# ⚡ QUICK SETUP - Permanent Tilgang (admin.driftpro.no)

## 🎯 Mål
Gi systemet permanent tilgang til e-post og OneDrive uten brukerinnlogging.

## ✅ Dine Azure Credentials (Allerede opprettet)
- Tenant ID: `15dd624a-cc33-4240-a6d5-8bc6797ae68c`
- Client ID: `4c0621e5-8bd6-479f-8833-fb480ad527d7`

---

## 📝 STEG 1: Azure Portal - Opprett App

1. Gå til: **https://portal.azure.com**
2. Søk: **"Azure Active Directory"**
3. Klikk: **"App registrations"** → **"+ New registration"**
4. Fyll inn:
   - Name: `DriftPro System`
   - Account type: **Single tenant**
5. Klikk: **"Register"**
6. **KOPIER**: Application (client) ID og Directory (tenant) ID

---

## 📝 STEG 2: Sett Permissions

1. Klikk: **"API permissions"** → **"+ Add a permission"**
2. Velg: **"Microsoft Graph"** → **"Application permissions"**
3. Legg til:
   - ✅ `Mail.Send`
   - ✅ `Files.ReadWrite.All`
4. Klikk: **"Add permissions"**
5. **KRITISK**: Klikk **"Grant admin consent"** → **"Yes"**

---

## 📝 STEG 3: Opprett Secret

1. Klikk: **"Certificates & secrets"** → **"+ New client secret"**
2. Description: `DriftPro Secret`
3. Expires: **24 months**
4. Klikk: **"Add"**
5. **KOPIER Value** (vises bare én gang!)

---

## 📝 STEG 4: Verifiser E-postkonto

✅ **Du har allerede**: `driftpro@mavilogistikk.no`

Verifiser at kontoen eksisterer i Microsoft 365 Admin Center.

---

## 📝 STEG 5: Sett Miljøvariabler i Netlify (PRODUKSJON)

1. Gå til: https://app.netlify.com
2. Velg prosjekt: **admin.driftpro.no**
3. **"Site settings"** → **"Environment variables"**
4. Legg til:
   - `GRAPH_TENANT_ID` = `15dd624a-cc33-4240-a6d5-8bc6797ae68c`
   - `GRAPH_CLIENT_ID` = `4c0621e5-8bd6-479f-8833-fb480ad527d7`
   - `GRAPH_CLIENT_SECRET` = [fra steg 3]
   - `GRAPH_SENDER_UPN` = `driftpro@mavilogistikk.no`

## 📝 STEG 6: Lokal Utvikling (.env.local)

Legg til i `.env.local`:

```bash
GRAPH_TENANT_ID=15dd624a-cc33-4240-a6d5-8bc6797ae68c
GRAPH_CLIENT_ID=4c0621e5-8bd6-479f-8833-fb480ad527d7
GRAPH_CLIENT_SECRET=[fra steg 3]
GRAPH_SENDER_UPN=driftpro@mavilogistikk.no
```

---

## 📝 STEG 7: Deploy & Test

1. I Netlify: **"Deploys"** → **"Trigger deploy"**
2. Vent til deploy er ferdig
3. Test på: https://admin.driftpro.no

---

## ✅ FERDIG!

Systemet har nå permanent tilgang! 🎉

**Se `SETUP_GUIDE_STEP_BY_STEP.md` for detaljert guide.**
