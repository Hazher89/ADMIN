# 🔧 Fiks Ansatt-data i Firebase

## Problemet

- Ansatte blir lagret i Firestore `users` collection
- Men de opprettes IKKE i Firebase Auth
- Derfor kan de ikke logge inn
- Det kan også være duplikater i `employees` collection

## Løsningen

### Steg 1: Migrer eksisterende ansatte til Firebase Auth

Åpne denne URL-en i nettleseren (erstatt med ditt companyId):

```
https://admin.driftpro.no/api/migrate-employees-to-auth?companyId=DITT_COMPANY_ID
```

Dette vil:
- Finne alle ansatte uten Firebase Auth UID
- Opprette Firebase Auth brukere for dem
- Oppdatere Firestore dokumenter med UID

### Steg 2: Sjekk resultatet

Etter migrering, sjekk:
1. Firebase Console → Authentication → Users
2. Se at alle ansatte har Firebase Auth brukere
3. Firebase Console → Firestore → `users` collection
4. Se at alle dokumenter har `uid` felt

### Steg 3: Rydd opp i `employees` collection (valgfritt)

Hvis du har en `employees` collection som ikke brukes:

1. Gå til Firebase Console → Firestore
2. Åpne `employees` collection
3. Sjekk om dokumentene der er duplikater av `users` collection
4. Hvis ja, kan du slette `employees` collection (men backup først!)

## Hvordan det fungerer nå

### Når du oppretter ny ansatt:

1. ✅ Firebase Auth bruker opprettes automatisk
2. ✅ Firestore dokument opprettes i `users` collection
3. ✅ Dokument-ID settes til Firebase Auth UID
4. ✅ Velkomstmail sendes automatisk
5. ✅ Ansatt kan logge inn med e-post og sette passord

### Datastruktur:

- **Firebase Auth**: Alle brukere (for innlogging)
- **Firestore `users` collection**: Alle ansatte/brukere (for data)
- **Dokument-ID**: Firebase Auth UID (for konsistens)

## Test

1. Opprett en ny ansatt i systemet
2. Sjekk Firebase Console → Authentication → Users
3. Sjekk Firebase Console → Firestore → `users` collection
4. Ansatt skal kunne logge inn og sette passord

## Feilsøking

### "User already exists in Firebase Auth"
- Brukeren eksisterer allerede i Firebase Auth
- Migrasjonen hopper over dem
- De kan fortsatt logge inn

### "Failed to create Firebase Auth user"
- Sjekk Firebase Console for feilmeldinger
- Verifiser at Firebase-miljøvariabler er satt
- Prøv å opprette bruker manuelt i Firebase Console

### Ansatte vises ikke i DriftPro
- Sjekk at de har `companyId` satt i Firestore
- Sjekk at de har `status: 'active'`
- Sjekk at de er i `users` collection (ikke `employees`)
