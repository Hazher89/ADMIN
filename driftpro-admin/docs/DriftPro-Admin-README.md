# DriftPro Admin – Komplett Systemdokumentasjon

Dette dokumentet forklarer hele DriftPro Admin-systemet: logistikk, bud-priser, ruteplanlegging, sjåfør/partner-flows, avvik, fravær, dokumenter og OneDrive, e-postsystem, varslinger, audit/logging, tilgangsstyring, sikkerhet/GDPR, drift og vedlikehold.

## Oversikt
- Plattform: Next.js (app router) med Firebase (Auth, Firestore, Storage), integrasjoner mot Microsoft Graph/OneDrive og e-post.
- Mål: Helhetlig administrasjon av logistikkoperasjoner, HR-funksjoner, dokumenthåndtering og kommunikasjon.
- Klienter: Web-admin, sjåførportal, partnerportal, iOS-app (SwiftUI) for mobile behov.

## Arkitektur
- Frontend: `src/app` for sider, `src/components` for gjenbrukbare komponenter.
- Backend API: `src/app/api/*` (Next.js server actions), bruker `src/lib/*` services.
- Firebase: `src/lib/firebase.ts` init, `src/lib/firebase-services.ts` høy-nivå CRUD og domene-funksjoner.
- Integrasjoner:
  - OneDrive: `src/lib/onedrive-service.ts` og `onedrive-config.ts`.
  - E-post: `src/lib/global-email-service.ts`, `email-system-service.ts`, `email-templates.ts`.
  - SMS: `src/lib/twilio-sms-service.ts`, `src/lib/sveve-sms-service.ts`.
  - Microsoft Graph bootstrap: `src/components/MicrosoftGraphBootstrapper.tsx`.
- iOS-app: `DriftPro/` mappen inneholder SwiftUI-klient.

## Roller og tilgang
- Roller: `admin`, `super_admin`, `employee`, `partner`, `driver`.
- Tilgangskontroll: basert på `AuthContext.tsx` og rollefelt på `users`/`employees`.
- Audit og logging: `auditLogs` for endringssporing av CRUD på ansatte, avdelinger, fravær, partnere m.m.

## Firestore-kart (utvalg av aktive samlinger)
- `users`: systembrukere med roller, companyId.
- `employees`: ansattdata, stilling, avdeling, kontakt.
- `partners`: samarbeidspartnere med kjøretøy/biler og ansvar.
- `orders`: ordrer knyttet til ruter.
- `plannedRoutes`: genererte/planlagte ruter (optimalisering, kost, distanse, tid).
- `routeAssignments`: tildelinger, filer, metadata, arkiv av rutedata.
- `timeclocks`: stemplinger (clock-in/clock-out) for ansatte.
- `documents`: dokumentmetadata (lagres enten i Firebase Storage eller OneDrive).
- `emailRules`, `emailLogs`: regelmotor og loggføring for e-postsystem.
- `auditLogs`: systemhendelser (create/update/delete m.m.).
- `internalAudits`: internrevisjoner med dokumenter, kommentarer og oppgaver.
- `audits`: partnerrevisjoner (legacy/partnersiden).
- `chats`: intern chat/tråd, meldinger og vedlegg.
- `passwordResetTokens`, `setupTokens`: tokens for passordoppsett/tilbakestilling.
- `systemSettings`, `systemStatus`, `systemLogs`: systemkonfig, status og logger.

Merk: `clockings`, `emails` og eventuelle typo-samlinger som `systen` er legacy/ubrukte.

## Innlogging og konto-oppsett
- Innlogging: `src/app/login/page.tsx` (Firebase Auth, e-post/passord).
- Førstegangsoppsett: `src/app/setup-password/page.tsx` og API-rutene for å sende setup-link (`send-password-setup`, `send-welcome-email`).
- Tilbakestilling: `src/app/forgot-password`, `src/app/reset-password` og tilhørende API-ruter (`forgot-password`, `reset-password`).
- Tokens: genereres i `passwordResetTokens` og `setupTokens` via API-rutene.

## Dashboard og navigasjon
- Admin Dashboard: `src/app/dashboard/page.tsx`, widgets for statistikk (ordre, stemplinger, dokumenter, varsler).
- Sidebar/Topbar: navigasjon og hurtigaksjoner (`Sidebar.tsx`, `Topbar.tsx`, `QuickActions.tsx`, `NotificationBell.tsx`).
- Global Søk: `src/components/GlobalSearch.tsx`, søker i dokumenter, ansatte, partnere m.m.

## Logistikk
- Avansert planlegging: `src/app/advanced-planning/page.tsx` og `src/app/dashboard/advanced-planning/page.tsx`.
  - Henter ordrer, sjåfører og kjøretøy; grupperer per dato; lager ruter.
  - Beregner estimert distanse/tid og kost; lagrer til `plannedRoutes`.
  - Oppdaterer `orders` med `routeId`, status `assigned`, og tildelt sjåfør/kjøretøy.
  - Arkiverer ruter både til OneDrive (`archiveRoutesToOneDrive`) og lokalt arkiv.
- Cockpit Interface: `dashboard/advanced-planning/cockpit-interface.tsx` for operativ oversikt (kjøretøy, rute-tildelinger, posisjon, status).
- Sjåfør-dashboard: `src/app/driver-dashboard/page.tsx` henter ruter for sjåfør fra `plannedRoutes` og viser progresjon.
- Partner-dashboard: `src/app/partner-dashboard` gir oversikt til samarbeidspartnere.

## Bud-priser
- Prisdata: `bud-priser-data.ts` og dokumenter (`BUD-PRIS.xlsx`, `Prisliste sjåfører ...`).
- Bruk: visning og kalkulasjon i planleggingsmodulene for estimert kost.

## Stempling (Timeclock)
- Side: `src/app/dashboard/timeclock/page.tsx` og `stempel/page.tsx` for oversikt og kontroll.
- Service: `getTimeClocks`, `clockIn`, `clockOut` i `firebase-services.ts` mot `timeclocks`.
- Dashboard-statistikk: aktive stemplinger, totale stemplinger på tvers av selskap.

## Avvik
- Avvikshåndtering: `deviations` samlingen, komponenter i dashboard for å registrere, følge opp og dokumentere avvik.
- iOS-klient har egne visninger for avvikskort og lister.

## Fravær og ferie
- Ferie/Fravær: `VacationCalendar.tsx` for planlegging og oversikt.
- `absences` samlingen og relevante HR-sider (`dashboard/hr/page.tsx`).

## Dokumenter og OneDrive
- Dokumentlagring:
  - Firebase Storage for binærfiler; metadata i `documents` (tittel, type, roller, avdeling, GDPR-flagg).
  - OneDrive-arkivering: `onedrive-service.ts` med opplasting, mappehåndtering og deling.
- GDPR-filter: `firebase-services.ts` filtrerer dokumenter basert på brukerrolle/avdeling.
- Visning: `dashboard/documents/page.tsx` og søk via `GlobalSearch.tsx`.

## E-postsystem
- Regler: `email-system-service.ts` leser/sparer `emailRules`, prosesserer standardregler (`DEFAULT_RULES`).
- Logger: API-endepunkter i `src/app/api/email-logs/*` opererer på `emailLogs` (hente, bulk-oppdatering/sletting, kø-status).
- Maler: `email-templates.ts` (bl.a. partner-tildelingsmail, velkomstmail).
- Innstillinger: `api/email-settings/route.ts` mot `systemSettings/email`.

## Varsler og kommunikasjon
- Chat: `chat-service.ts` mot `chats` med tråd og meldinger.
- SMS: Twilio/Sveve service for utsending.
- Varselbjelle: `NotificationBell.tsx` for UI-varsler.

## Audit og sporbarhet
- `auditLogs`: logger CRUD-hendelser med `action`, `userId`, `resourceType`, `resourceId`, `companyId`, `timestamp`, `metadata`.
- `internalAudits`: full intern revisjonsmodul (opprett, hent, oppdater, slett, dokumenter, kommentarer).
- `audits`: partnerrevisjoner brukt i partnersiden.

## Rydding og vedlikehold
- Cleanup API: `src/app/api/cleanup-firebase/route.ts` har målrettet sletting per companyId for mange samlinger (chats, tokens, dokumenter m.m.).
- Token-rydder: funksjoner for å fjerne utløpte `passwordResetTokens`/`setupTokens`.

## Miljøvariabler
- Firebase klient:
  - `NEXT_PUBLIC_FIREBASE_API_KEY`
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - `NEXT_PUBLIC_FIREBASE_APP_ID`
- Microsoft Graph/OneDrive:
  - `MS_TENANT_ID`, `MS_CLIENT_ID`, `MS_CLIENT_SECRET`, `MS_DRIVE_ID` (avhengig av oppsett)
- E-post (SMTP eller Graph): relevante nøkler/passord (se `OFFICE365_EMAIL_SETUP.md` og `MICROSOFT_GRAPH_SETUP.md`).

## Sikkerhet og GDPR
- Rollebasert tilgang til dokumenter og HR-data.
- Audit logging for sporbarhet.
- Eksterne tjenestenøkler lagres som miljøvariabler, ikke i kildekode.
- GDPR-dokumentasjon: `GDPR_COMPLIANCE.md`.

## Deploy og drift
- CI/CD: `.github/workflows/deploy.yml` (tilpass for Netlify/Vercel).
- Build: `npm run build` (krever gyldige env-variabler, ellers feiler SSR-init for Firebase).
- Lokal utvikling: `npm install`, `npm run dev`.

## Feilsøking
- Firebase API Key feil ved build: sjekk `.env.local` og at API-nøkler er riktig for prosjektet.
- Manglende data i dashboards: verifiser at `companyId` er riktig på bruker og data.
- OneDrive-feil: sjekk Azure-app-tilganger og `onedrive-config.ts`.
- E-postkø: se `email-logs` API-endepunkter og statusfelt.

## Hurtigstart (dev)
- Installer: `npm install`
- Miljø: kopier `env.example` til `.env.local` og fyll ut nøkler.
- Start: `npm run dev`
- Pålogging: Opprett bruker eller bruk eksisterende; send setup/velkomst via API.

## Viktige flows
- Ruteoptimalisering:
  - Velg ordrer og tilgjengelige sjåfører/kjøretøy.
  - Generer `plannedRoutes` med estimater.
  - Oppdater `orders` med `assigned` og `routeId`.
  - Arkiver til OneDrive og lokalt.
- Sjåførstatus:
  - Sjåfør ser sine tildelte ruter (`driver-dashboard`).
  - Statusendringer: `in_progress`, `completed` og leveringsantall.
- Stempling:
  - `clockIn`/`clockOut` i `timeclocks`.
- Dokumenthåndtering:
  - Last opp dokument (Storage/OneDrive), lag metadata i `documents`.
  - Vis og søk med rollefilter.
- HR:
  - Registrer fravær/ferie; se `VacationCalendar.tsx` og `absences`.
- Avvik:
  - Opprett og følg opp i `deviations`.

## iOS-app (SwiftUI)
- Autentisering og grunnleggende visning av dokumenter, avvik, selskapsvalg.
- Mapper: `DriftPro/DriftPro/Views`, `Models`, `Services`.

## Vedlegg og referanser
- Konfig- og oppsettguider: `PRODUCTION_SETUP.md`, `OFFICE365_EMAIL_SETUP.md`, `MICROSOFT_GRAPH_SETUP.md`, `ONEDRIVE_SETUP_GUIDE.md`, `STORAGE_OVERVIEW.md`.
- Prisfiler: `BUD-PRIS.xlsx`, `Prisliste sjåfører ...`.

---

For spørsmål eller forbedringer, opprett en issue i GitHub-repoet. Denne README dekker hele DriftPro Admin og gir deg rask inngang til drift, utvikling og vedlikehold.