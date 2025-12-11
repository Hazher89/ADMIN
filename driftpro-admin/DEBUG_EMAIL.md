# 🔍 Debug E-post-sending

## Test E-post-endpointet

Åpne denne URL-en i nettleseren (erstatt med din e-post):

```
https://admin.driftpro.no/api/email/test-app-only?to=din@email.no
```

Dette vil vise deg:
- ✅ Om miljøvariabler er satt
- ✅ Om token kan hentes
- ✅ Om e-post kan sendes
- ❌ Detaljerte feilmeldinger hvis noe feiler

## Sjekk Netlify Logs

1. Gå til: https://app.netlify.com
2. Velg prosjekt: **admin.driftpro.no**
3. Gå til: **"Functions"** → **"Logs"**
4. Se etter feilmeldinger når du prøver å sende e-post

## Vanlige Problemer

### 1. E-postkonto har ikke rettigheter
Sjekk at `driftpro@mavilogistikk.no`:
- Eksisterer i Microsoft 365
- Har lisens (Microsoft 365 Business Basic eller høyere)
- Kan sende e-post (ikke blokkert)

### 2. Deploy ikke ferdig
- Vent til Netlify deploy er ferdig
- Trigger ny deploy hvis nødvendig

### 3. E-post går til spam
- Sjekk spam/junk-mappen
- Verifiser SPF/DKIM/DMARC records

## Test Steg-for-steg

1. **Test endpointet først:**
   ```
   https://admin.driftpro.no/api/email/test-app-only?to=din@email.no
   ```

2. **Hvis test fungerer, prøv å legge til ansatt igjen**

3. **Sjekk konsollen (F12) for feilmeldinger**

4. **Sjekk Netlify logs for server-side feil**
