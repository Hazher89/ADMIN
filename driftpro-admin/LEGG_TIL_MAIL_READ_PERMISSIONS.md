# Legg til Mail.Read permissions i Azure

## Hva du må gjøre

Du har allerede en Azure App Registration, men mangler permissions for å **lese** e-poster. Du har `Mail.Send` (for å sende), men trenger også `Mail.Read` og `Mail.ReadWrite` (for å lese).

## Steg-for-steg

### Steg 1: Gå til API permissions
1. Du er allerede på "API permissions" siden (som vist i skjermbildet)
2. Se på tabellen under "Configured permissions"

### Steg 2: Legg til Mail.Read permission
1. Klikk på knappen **"+ Add a permission"** (øverst til høyre i tabellen)
2. I popup-vinduet som åpnes:
   - Velg **"Microsoft Graph"** (første alternativ)
   - Klikk på den første knappen

### Steg 3: Velg Application permissions
1. Du ser nå to faner: **"Delegated permissions"** og **"Application permissions"**
2. **VIKTIG:** Klikk på fanen **"Application permissions"** (ikke Delegated!)
3. I søkefeltet, skriv: **"Mail.Read"**
4. Merk av for:
   - ✅ **`Mail.Read`** - "Read mail in all mailboxes"
   - ✅ **`Mail.ReadWrite`** - "Read and write mail in all mailboxes"
5. Klikk **"Add permissions"** nederst

### Steg 4: Gi admin consent
1. Du kommer tilbake til permissions-listen
2. Du ser nå de nye permissions:
   - `Mail.Read` (Application)
   - `Mail.ReadWrite` (Application)
3. Under "Status" kolonnen står det sannsynligvis: ⚠️ **"Not granted for MAVI Logistikk AS"**
4. Klikk på knappen **"Grant admin consent for MAVI Logistikk AS"** (øverst til høyre)
5. Klikk **"Yes"** i bekreftelsen
6. Status skal nå endre seg til: ✅ **"Granted for MAVI Logistikk AS"**

### Steg 5: Verifiser
Etter at du har gitt consent, skal tabellen vise:

| API / Permissions name | Type | Status |
|------------------------|------|--------|
| Files.ReadWrite.All | Application | ✅ Granted |
| **Mail.Read** | **Application** | **✅ Granted** |
| **Mail.ReadWrite** | **Application** | **✅ Granted** |
| Mail.Send | Application | ✅ Granted |
| User.Read | Delegated | ✅ Granted |

## Neste steg

Når permissions er lagt til og consent er gitt:

1. **Sjekk at miljøvariablene er satt:**
   ```bash
   GRAPH_TENANT_ID=din-tenant-id
   GRAPH_CLIENT_ID=din-client-id
   GRAPH_CLIENT_SECRET=din-client-secret
   GRAPH_SENDER_UPN=drifpro@mavilogistikk.no
   ```

2. **Hvis du ikke har Client Secret:**
   - Gå til "Certificates & secrets" i venstre meny
   - Klikk "+ New client secret"
   - Kopier verdien med en gang

3. **Test i DriftPro:**
   - Gå til: Samarbeidspartnere → Ruter Tildelt
   - Klikk: "Innkommende ruter fra SAP"
   - Klikk: "Oppdater"
   - Systemet skal nå kunne hente e-poster!

## Viktig å huske

- ✅ Bruk **"Application permissions"** (ikke Delegated)
- ✅ Gi **admin consent** etter å ha lagt til permissions
- ✅ Vent 1-2 minutter etter consent før du tester




