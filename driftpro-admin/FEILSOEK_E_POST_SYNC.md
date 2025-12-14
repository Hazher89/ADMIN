# Feilsøking: Innkommende ruter fra SAP vises ikke

Dette dokumentet beskriver hvordan du feilsøker hvis PDF-ene ikke vises i "Innkommende ruter fra SAP".

## ✅ Sjekkliste

### 1. Verifiser Azure App Registration Permissions

I Azure Portal, sjekk at din App Registration har følgende **Application permissions** (ikke Delegated):

- ✅ `Mail.Read` - "Read mail in all mailboxes"
- ✅ `Mail.ReadWrite` - "Read and write mail in all mailboxes"  
- ✅ `Files.ReadWrite.All` - "Read and write files in all site collections" (hvis du skal lagre til OneDrive)

**Viktig:** Alle permissions må ha status "✅ Granted for MAVI Logistikk AS" (grønt hakeikon).

Hvis permissions ikke er granted:
1. Gå til "API permissions" i din App Registration
2. Klikk "Grant admin consent for MAVI Logistikk AS"
3. Bekreft med "Yes"

### 2. Verifiser Netlify Miljøvariabler

I Netlify Dashboard → Site settings → Environment variables, sjekk at følgende er satt:

```
GRAPH_TENANT_ID=din-tenant-id
GRAPH_CLIENT_ID=din-client-id  
GRAPH_CLIENT_SECRET=din-client-secret
GRAPH_SENDER_UPN=driftpro@mavilogistikk.no
```

**Viktig:**
- `GRAPH_SENDER_UPN` må være nøyaktig e-postadressen til postboksen du vil lese fra
- `GRAPH_CLIENT_SECRET` må være den **nyeste** Client Secret (hvis den har utløpt, opprett en ny)
- Redeploy applikasjonen etter å ha endret miljøvariabler

### 3. Test Synkronisering

1. Gå til "Samarbeidspartnere" → "Ruter Tildelt" → "Innkommende ruter fra SAP"
2. Åpne nettleserens Developer Tools (F12) → Console tab
3. Klikk "Oppdater"-knappen
4. Se etter feilmeldinger i konsollen

### 4. Sjekk Nettverksforespørsler

I Developer Tools → Network tab:
1. Filtrer på "sync"
2. Klikk "Oppdater"-knappen
3. Klikk på `/api/inbound/sap/sync` forespørselen
4. Se "Response" for feilmeldinger eller debug-informasjon

Vanlige feil:
- `"Microsoft Graph ikke konfigurert"` → Miljøvariabler mangler
- `"Failed to get access token"` → Feil credentials eller Client Secret har utløpt
- `"403 Forbidden"` → Permissions ikke granted eller mangler
- `"404 Not Found"` → `GRAPH_SENDER_UPN` er feil (postboks finnes ikke)

### 5. Sjekk at E-poster Faktisk Eksisterer

- Logg inn på `driftpro@mavilogistikk.no` i Outlook/Web
- Verifiser at det faktisk er e-poster i innboksen
- Sjekk at e-poster har PDF-vedlegg

### 6. Sjekk Server-Logs (Netlify Functions Logs)

I Netlify Dashboard → Functions → View logs:
- Se etter feilmeldinger relatert til Graph API
- Sjekk at access token blir opprettet

## 🔧 Ofte Forekommende Problemer

### Problem: "Access token feilet"

**Løsning:**
1. Sjekk at `GRAPH_TENANT_ID`, `GRAPH_CLIENT_ID`, og `GRAPH_CLIENT_SECRET` er riktige
2. Sjekk at Client Secret ikke har utløpt (opprett ny hvis nødvendig)
3. Redeploy applikasjonen

### Problem: "403 Forbidden" eller "Insufficient permissions"

**Løsning:**
1. Gå til Azure Portal → App Registration → API permissions
2. Sjekk at alle permissions er "Application" (ikke "Delegated")
3. Klikk "Grant admin consent for MAVI Logistikk AS"
4. Vent noen minutter og prøv igjen

### Problem: "404 Not Found" når henter e-poster

**Løsning:**
1. Verifiser at `GRAPH_SENDER_UPN` er riktig e-postadresse
2. Sjekk at postboksen faktisk eksisterer i Microsoft 365
3. Prøv å logge inn på postboksen i Outlook/Web for å verifisere

### Problem: E-poster vises, men ingen PDF-vedlegg

**Løsning:**
1. Sjekk at e-postene faktisk har PDF-vedlegg
2. Sjekk Network-tab i Developer Tools for feilmeldinger ved nedlasting av vedlegg
3. Sjekk at `Files.ReadWrite.All` permission er granted (hvis du skal lagre til OneDrive)

### Problem: "Ingen innkommende ruter logget ennå"

**Løsning:**
1. Sjekk at det faktisk er e-poster i `driftpro@mavilogistikk.no` innboksen
2. Prøv å sende en test-e-post med PDF-vedlegg til `driftpro@mavilogistikk.no`
3. Vent noen minutter og klikk "Oppdater" igjen
4. Sjekk console for feilmeldinger

## 📞 Hvis Alt Feiler

1. Sjekk alle stegene over
2. Kopier feilmeldingen fra Developer Tools Console
3. Sjekk Netlify Functions logs for mer detaljer
4. Verifiser at Azure App Registration har alle nødvendige permissions med "Admin Consent" granted

## 🔍 Debug-Modus

I Developer Tools Console, etter å ha klikket "Oppdater", vil du se:
- `📧 Henter e-poster fra driftpro@mavilogistikk.no...`
- `✅ Fant X e-poster`
- `✅ Prosessert e-post: [emne] (X PDF-vedlegg)`

Hvis du ser feilmeldinger i stedet, følg feilsøkingsguide over basert på feilmeldingen.


