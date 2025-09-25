# Office 365 E-post Setup for DriftPro

Denne guiden viser deg hvordan du setter opp Office 365-e-poster for DriftPro-systemet.

## 🎯 Hva du får

Med Office 365-e-poster kan DriftPro sende:
- ✅ **Velkommen-e-poster** til nye brukere
- ✅ **Glemt passord-e-poster** med tilbakestillingslinker
- ✅ **Bruker-opprettelse lenker** for passord-oppsett
- ✅ **Systemvarsler** og notifikasjoner
- ✅ **HMS-rapporter** og avviksmeldinger
- ✅ **Automatiske e-poster** fra alle systemfunksjoner

## 📋 Forutsetninger

Du trenger:
- [ ] Office 365 Business-konto (eller personlig)
- [ ] E-postadresse i Office 365
- [ ] Passord til Office 365-kontoen
- [ ] Tilgang til å sende SMTP-e-poster (vanligvis aktivert som standard)

## 🔧 Steg-for-steg oppsett

### Steg 1: Forbered Office 365-kontoen

1. **Logg inn på Office 365**
   - Gå til [office.com](https://office.com)
   - Logg inn med din business-konto

2. **Sjekk SMTP-innstillinger**
   - SMTP er vanligvis aktivert som standard
   - Hvis ikke, kontakt din IT-administrator

3. **Hvis du har 2FA aktivert:**
   - Du må enten deaktivere 2FA midlertidig
   - Eller opprette en "App Password" for SMTP

### Steg 2: Opprett e-postadresse for DriftPro

1. **Anbefalt e-postadresse:**
   ```
   driftpro@dittdomene.com
   eller
   noreply@dittdomene.com
   eller
   system@dittdomene.com
   ```

2. **Hvis du ikke har egen domene:**
   ```
   din-bruker@dittdomene.onmicrosoft.com
   ```

### Steg 3: Konfigurer DriftPro

1. **Åpne setup-filen:**
   ```bash
   nano setup-office365-smtp.js
   ```

2. **Oppdater e-postinnstillingene:**
   ```javascript
   auth: {
     user: 'driftpro@dittdomene.com', // Din Office 365 e-post
     pass: 'ditt-office365-passord'   // Ditt Office 365 passord
   }
   ```

3. **Kjør setup:**
   ```bash
   node setup-office365-smtp.js
   ```

### Steg 4: Test e-postfunksjonen

1. **Kjør test-scriptet:**
   ```bash
   node test-office365-email.js
   ```

2. **Sjekk at du mottar:**
   - Velkommen-e-post
   - Glemt passord-e-post
   - Bruker-opprettelse e-post

## 🔐 Sikkerhet og best practices

### App Passwords (anbefalt for 2FA)

Hvis du har 2FA aktivert:

1. **Gå til Microsoft-kontoen din:**
   - [account.microsoft.com](https://account.microsoft.com)
   - Logg inn med din Office 365-konto

2. **Opprett App Password:**
   - Gå til "Security" → "Advanced security options"
   - Klikk "Create a new app password"
   - Gi det navnet "DriftPro SMTP"
   - Kopier det genererte passordet

3. **Bruk App Password i DriftPro:**
   ```javascript
   auth: {
     user: 'driftpro@dittdomene.com',
     pass: 'generert-app-password-her' // Bruk App Password, ikke vanlig passord
   }
   ```

### E-postadresse best practices

**Anbefalte e-postadresser:**
- `driftpro@dittdomene.com` - Hovedadresse
- `noreply@dittdomene.com` - For automatiske e-poster
- `system@dittdomene.com` - For systemvarsler

**Unngå:**
- Personlige e-postadresser
- E-postadresser som kan endres
- E-postadresser uten profesjonelt utseende

## 🚨 Feilsøking

### Vanlige problemer

**1. Authentication Error (EAUTH)**
```
❌ Error: Invalid login
```
**Løsning:**
- Sjekk e-postadresse og passord
- Bruk App Password hvis du har 2FA
- Kontakt IT-administrator hvis det er corporate-konto

**2. Connection Error (ECONNECTION)**
```
❌ Error: Connection timeout
```
**Løsning:**
- Sjekk internettforbindelse
- Sjekk firewall-innstillinger
- Verifiser at SMTP er aktivert i Office 365

**3. TLS Error**
```
❌ Error: TLS handshake failed
```
**Løsning:**
- Sjekk at port 587 er åpen
- Verifiser TLS-innstillinger
- Prøv å deaktivere TLS midlertidig for testing

### Test-kommandoer

**Test SMTP-tilkobling:**
```bash
telnet smtp.office365.com 587
```

**Test med curl:**
```bash
curl -v --ssl-reqd --url 'smtps://smtp.office365.com:587' \
  --user 'din-email@dittdomene.com:ditt-passord' \
  --mail-from 'din-email@dittdomene.com' \
  --mail-rcpt 'test@example.com' \
  --upload-file email.txt
```

## 📧 E-postmaler

DriftPro kommer med forhåndsdefinerte maler:

### Velkommen-e-post
- Velkomstmelding
- Logg inn-link
- Brukerinformasjon
- Hjelpeinformasjon

### Glemt passord
- Sikkerhetsadvarsel
- Tilbakestillingslink (24 timer gyldig)
- Sikkerhetsinformasjon
- Kontaktinformasjon

### Bruker-opprettelse
- Passord-oppsett link (7 dager gyldig)
- Brukerinformasjon
- Instruksjoner
- Hjelpeinformasjon

## 🔄 Oppdatering og vedlikehold

### Regelmessig vedlikehold

1. **Sjekk e-postinnstillinger månedlig**
2. **Test e-postfunksjonen kvartalsvis**
3. **Oppdater passord årlig**
4. **Overvåk e-postleveringsstatistikk**

### Backup og recovery

1. **Lag backup av e-postinnstillinger:**
   ```bash
   # Eksporter Firebase e-postinnstillinger
   firebase firestore:export --collection-ids systemSettings
   ```

2. **Dokumenter e-postinnstillinger:**
   - Lagre e-postadresse og passord sikkert
   - Dokumenter App Password hvis brukt
   - Lagre kontaktinformasjon til IT-administrator

## 📞 Support

### Hvis du trenger hjelp

1. **DriftPro Support:**
   - E-post: support@driftpro.no
   - Dokumentasjon: [DriftPro Docs](https://docs.driftpro.no)

2. **Office 365 Support:**
   - Microsoft Support: [support.microsoft.com](https://support.microsoft.com)
   - Office 365 Admin Center: [admin.microsoft.com](https://admin.microsoft.com)

3. **IT-administrator:**
   - Kontakt din bedrifts IT-avdeling
   - Be om hjelp med SMTP-innstillinger
   - Få hjelp med sikkerhetsinnstillinger

## ✅ Sjekkliste

Før du går live:

- [ ] Office 365-konto er aktivert
- [ ] E-postadresse er opprettet
- [ ] SMTP er aktivert
- [ ] App Password er opprettet (hvis 2FA)
- [ ] Setup-script er kjørt
- [ ] Test-e-poster er mottatt
- [ ] Alle e-postmaler fungerer
- [ ] Sikkerhetsinnstillinger er på plass
- [ ] Backup er lagret
- [ ] Dokumentasjon er oppdatert

## 🎉 Gratulerer!

Når du har fullført alle stegene, vil DriftPro kunne sende profesjonelle e-poster fra din Office 365-konto. Dette gir:

- ✅ **Profesjonelt utseende** - E-poster kommer fra din bedriftsdomene
- ✅ **Høy leveringsrate** - Office 365 har utmerket leveringsstatistikk
- ✅ **Sikkerhet** - Microsofts sikkerhetsinfrastruktur
- ✅ **Skalerbarhet** - Kan håndtere mange e-poster
- ✅ **Integrasjon** - Fungerer perfekt med DriftPro

---

**© 2024 DriftPro - Alle rettigheter forbeholdt**
