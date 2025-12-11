# 📧 Opprett System E-postkonto: driftpro@driftpro.no

## 🎯 Mål
Opprett e-postkontoen `driftpro@driftpro.no` som systemet skal bruke for å sende e-poster.

---

## STEG 1: Gå til Microsoft 365 Admin Center

1. Åpne nettleser og gå til: **https://admin.microsoft.com**
2. Logg inn med din Microsoft 365 administrator-konto
3. Du skal nå se Microsoft 365 Admin Center dashboard

---

## STEG 2: Opprett Ny Bruker

1. I venstre meny, klikk på **"Users"**
2. Klikk på **"Active users"**
3. Klikk på **"+ Add a user"** (blå knapp øverst)

---

## STEG 3: Fyll inn Brukerinformasjon

### Basic Information:
- **First name**: `DriftPro`
- **Last name**: `System`
- **Display name**: `DriftPro System` (eller bare `DriftPro`)
- **Username**: `driftpro` (dette blir `driftpro@driftpro.no`)

### Password:
- **Password**: Klikk på **"Generate password"** (anbefalt)
- **Require this user to change their password when they first sign in**: 
  - **IKKE huk av** (systemkonto, ingen skal logge inn)

### Product licenses:
- **Microsoft 365 Business Basic** eller høyere (for e-post og OneDrive)
- Huk av for den lisensen du har

### Optional settings:
- **Roles**: La stå som **"User"** (standard)
- **Profile info**: Kan la stå tomt

---

## STEG 4: Fullfør Opprettelse

1. Klikk på **"Add"** eller **"Finish adding"** (blå knapp)
2. Vent til brukeren er opprettet (10-30 sekunder)

---

## STEG 5: Verifiser E-postkontoen

1. Gå tilbake til **"Active users"**
2. Søk etter: `driftpro`
3. Du skal nå se brukeren: **"DriftPro System"**
4. Klikk på brukeren for å se detaljer
5. **KOPIER**: E-postadressen (skal være `driftpro@driftpro.no`)

---

## STEG 6: Sett i Netlify Environment Variables

1. Gå til: **https://app.netlify.com**
2. Velg prosjekt: **admin.driftpro.no**
3. Gå til: **"Site settings"** → **"Environment variables"**
4. Legg til eller oppdater:

```
GRAPH_SENDER_UPN = driftpro@driftpro.no
```

5. Klikk **"Save"**

---

## STEG 7: Sett i Lokal .env.local (for utvikling)

Legg til i `.env.local`:

```bash
GRAPH_SENDER_UPN=driftpro@driftpro.no
```

---

## STEG 8: Verifiser at E-postkontoen Fungerer

1. Vent 5-10 minutter (kan ta litt tid før e-postkontoen er aktiv)
2. Prøv å sende en test-e-post fra systemet
3. Sjekk at e-posten sendes fra `driftpro@driftpro.no`

---

## ✅ CHECKLIST

- [ ] E-postkonto opprettet: `driftpro@driftpro.no`
- [ ] Lisens tildelt (Microsoft 365 Business Basic eller høyere)
- [ ] E-postadresse kopiert
- [ ] `GRAPH_SENDER_UPN` satt i Netlify
- [ ] `GRAPH_SENDER_UPN` satt i `.env.local` (lokalt)
- [ ] Testet e-post-sending

---

## 🆘 Feilsøking

### "E-postkontoen eksisterer ikke"
- Vent 5-10 minutter og prøv igjen
- Sjekk at brukeren er opprettet i "Active users"

### "E-poster sendes ikke"
- Sjekk at lisens er tildelt
- Sjekk at `GRAPH_SENDER_UPN` er riktig satt
- Verifiser at admin consent er gitt i Azure Portal

### "Kan ikke logge inn"
- Dette er normalt! Systemkontoen skal ikke brukes til innlogging
- Den brukes kun av systemet for å sende e-poster

---

## 🎉 FERDIG!

Når dette er gjort, vil alle e-poster fra systemet sendes fra:
**`driftpro@driftpro.no`**

Denne e-postkontoen vil:
- ✅ Sende alle system-e-poster (velkomstmail, varsler, etc.)
- ✅ Være tilgjengelig for OneDrive-lagring
- ✅ Fungere 24/7 uten brukerinnlogging
