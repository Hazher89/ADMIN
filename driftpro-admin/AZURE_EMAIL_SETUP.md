# Azure Setup for å motta e-poster i DriftPro

## Oversikt

For at DriftPro skal kunne lese innkommende e-poster fra `driftpro@mavilogistikk.no` via Microsoft Graph API, må du konfigurere Azure App Registration med **Application permissions** (app-only).

## Steg-for-steg oppsett

### Steg 1: Gå til Azure Portal
1. Gå til [Azure Portal](https://portal.azure.com)
2. Logg inn med en konto som har admin-tilgang (f.eks. driftpro@mavilogistikk.no)
3. Søk etter "App registrations" i søkefeltet

### Steg 2: Opprett eller oppdater App Registration

#### Hvis du allerede har en app:
1. Finn eksisterende app (f.eks. "DriftPro Mail App")
2. Klikk på den for å åpne konfigurasjonen

#### Hvis du må opprette ny app:
1. Klikk "New registration"
2. Navn: `DriftPro Email Reader`
3. Supported account types: "Accounts in this organizational directory only"
4. Redirect URI: Ikke nødvendig for app-only (kan la stå tomt)
5. Klikk "Register"

### Steg 3: Konfigurer API Permissions (VIKTIG!)

1. Gå til "API permissions" i venstre meny
2. **Sjekk om det allerede er permissions** - hvis du har delegated permissions (Mail.Read, Mail.Send), må du også legge til **Application permissions**
3. Klikk "Add a permission"
4. Velg "Microsoft Graph"
5. Velg "Application permissions" (IKKE Delegated!)
6. Legg til disse permissions:
   - ✅ `Mail.Read` (for å lese e-poster)
   - ✅ `Mail.ReadWrite` (for å lese attachments)
   - ✅ `User.Read.All` (for å lese brukerinfo, valgfritt men anbefalt)
7. Klikk "Add permissions"
8. **VIKTIG:** Klikk "Grant admin consent for [ditt organisasjonsnavn]"
   - Dette må gjøres for at permissions skal fungere!

### Steg 4: Opprett Client Secret

1. Gå til "Certificates & secrets" i venstre meny
2. Klikk "New client secret"
3. Beskrivelse: `DriftPro Email Reader Secret`
4. Expires: Velg "24 months" eller lengre
5. Klikk "Add"
6. **VIKTIG:** Kopier "Value" umiddelbart (den vises bare én gang!)
   - Dette er din `GRAPH_CLIENT_SECRET`

### Steg 5: Kopier nødvendig informasjon

1. Gå til "Overview" i venstre meny
2. Kopier:
   - **Application (client) ID** → Dette er din `GRAPH_CLIENT_ID`
   - **Directory (tenant) ID** → Dette er din `GRAPH_TENANT_ID`

### Steg 6: Sett miljøvariabler

Legg til disse i `.env.local` (lokalt) eller i produksjonsmiljøet:

```bash
# Microsoft Graph App-Only (for å lese e-poster)
GRAPH_TENANT_ID=din-tenant-id-her
GRAPH_CLIENT_ID=din-client-id-her
GRAPH_CLIENT_SECRET=din-client-secret-her
GRAPH_SENDER_UPN=drifpro@mavilogistikk.no
```

### Steg 7: Test

1. Start serveren på nytt
2. Gå til DriftPro → Samarbeidspartnere → Ruter Tildelt
3. Klikk "Innkommende ruter fra SAP"
4. Klikk "Oppdater"
5. Systemet skal nå hente e-poster fra drifpro@mavilogistikk.no

## Troubleshooting

### Feil: "Microsoft Graph ikke konfigurert"
- Sjekk at alle miljøvariabler er satt riktig
- Sjekk at Client Secret ikke er utløpt

### Feil: "Insufficient privileges"
- Sjekk at du har gitt "Grant admin consent" i Azure
- Sjekk at du har lagt til "Application permissions" (ikke bare Delegated)

### Ingen e-poster vises
- Sjekk at e-postadressen driftpro@mavilogistikk.no eksisterer i Microsoft 365
- Sjekk at det faktisk er e-poster i postboksen
- Sjekk server-loggene for feilmeldinger

## Viktige notater

- **Application permissions** er nødvendig for server-side lesing uten brukerinnlogging
- **Delegated permissions** fungerer bare når en bruker logger inn
- E-poster sendt til driftpro@mavilogistikk.no kommer automatisk inn - ingen ekstra konfigurasjon trengs i Azure
- Systemet leser bare e-poster, det endrer ikke på e-postene (med mindre du har lagt til Mail.ReadWrite som Application permission)




