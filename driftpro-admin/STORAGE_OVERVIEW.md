# 📁 DriftPro - Fil- og Datalagring Oversikt

## 🎯 Hvor lagres alle data?

DriftPro bruker **Firebase Storage** (Google Cloud Storage) for all filopplasting og lagring. Alle PDFer, dokumenter, bilder og andre filer lagres automatisk i Firebase Storage med en organisert mappestruktur.

---

## 📂 Lagringsstruktur i Firebase Storage

### 1. **Dokumenter (PDFer, Word, Excel, etc.)**
```
documents/
  └── {companyId}/
      └── {timestamp}_{filename}
```
**Eksempel:** `documents/company123/1703123456789_handbook.pdf`

**Brukes til:**
- Policy-dokumenter
- Prosedyre-dokumenter
- Skjemaer
- Rapporter
- Andre dokumenter lastet opp i dokumentmodulen

**Kode:** `src/lib/firebase-services.ts` - `uploadDocument()`

---

### 2. **Interne Revisjoner (Audit Documents)**
```
audits/
  └── {companyId}/
      └── {auditId}/
          └── {timestamp}_{filename}
```
**Eksempel:** `audits/company123/audit456/1703123456789_audit_report.pdf`

**Brukes til:**
- Revisjonsdokumenter
- Vedlegg til interne revisjoner
- Dokumentasjon knyttet til revisjoner

**Kode:** `src/lib/firebase-services.ts` - `uploadAuditDocument()`

---

### 3. **Selskap-filer (Company Files)**
```
companies/
  └── {companyId}/
      ├── avatar/
      │   └── {filename}
      ├── logo/
      │   └── {filename}
      └── documents/
          └── {filename}
```
**Eksempel:** 
- `companies/company123/avatar/profile.jpg`
- `companies/company123/logo/company_logo.png`
- `companies/company123/documents/contract.pdf`

**Brukes til:**
- Selskapets profilbilde
- Selskapets logo
- Selskapsspesifikke dokumenter

**Kode:** `src/app/dashboard/companies/page.tsx` - `uploadFilesToStorage()`

---

### 4. **Samarbeidspartnere (Partner Files)**
```
partners/
  └── {companyId}/
      └── {partnerId}/
          └── assignments/
              └── {assignmentId}/
                  └── {timestamp}_{filename}
```
**Eksempel:** `partners/company123/partner789/assignments/assignment456/1703123456789_contract.pdf`

**Brukes til:**
- Filer knyttet til partner-oppdrag
- Kontrakter
- Dokumentasjon for samarbeidspartnere

**Kode:** `src/lib/firebase-services.ts` - `uploadPartnerAssignmentFile()`

**Alternativ struktur (i partners page):**
```
partner-files/
  └── {timestamp}_{filename}
```
**Kode:** `src/app/dashboard/partners/page.tsx` - `uploadFilesToFirebase()`

---

### 5. **Chat-filer (Chat Attachments)**
```
chat-files/
  └── {chatId}/
      └── {timestamp}_{filename}
```
**Eksempel:** `chat-files/chat123/1703123456789_image.jpg`

**Brukes til:**
- Filer delt i chat
- Bilder sendt i meldinger
- Vedlegg i chat-konversasjoner

**Kode:** `src/lib/chat-service.ts` - `uploadFile()`

---

## 🗄️ Database (Firestore) - Metadata

Selv om filene lagres i Firebase Storage, lagres **metadata** (informasjon om filene) i **Firestore**:

### Collections i Firestore:

1. **`documents`** - Metadata for alle dokumenter
   - `fileName`, `fileUrl`, `fileSize`, `fileType`
   - `title`, `description`, `category`
   - `companyId`, `uploadedBy`
   - `createdAt`, `updatedAt`

2. **`internalAudits`** - Metadata for revisjonsdokumenter
   - Inneholder array med `documents` som har `fileUrl`

3. **`partners/{partnerId}/assignments/{assignmentId}/files`** - Metadata for partner-filer

4. **`chats/{chatId}/messages`** - Chat-meldinger med fil-URLer

---

## 🔐 Sikkerhet og Tilgang

### Firebase Storage Security Rules

Alle filer er organisert etter `companyId` for å sikre at:
- ✅ Kun brukere fra samme selskap kan se filene
- ✅ GDPR-kompatibel dataseparasjon
- ✅ Automatisk tilgangskontroll basert på brukerens rolle

### Rollebasert tilgang:
- **Super Admin / Admin:** Tilgang til alle filer i selskapet
- **Department Leader:** Tilgang til filer i egen avdeling
- **Employee:** Tilgang til egne filer

---

## 📊 Lagringsstatistikk

### Firebase Storage Bucket:
- **Bucket navn:** `driftpro-40ccd.appspot.com`
- **Lokasjon:** Google Cloud Storage (globalt distribuert)
- **Backup:** Automatisk backup av Google Cloud
- **Sikkerhet:** Kryptert i transit og i ro

### Lagringskapasitet:
- Firebase Storage har **ubegrenset lagringskapasitet**
- Betales per GB lagret per måned
- Se [Firebase Pricing](https://firebase.google.com/pricing) for detaljer

---

## 🔄 Automatisk Organisering

Alle filer organiseres automatisk når de lastes opp:

1. **Timestamp prefix:** Alle filer får `{timestamp}_` prefix for å unngå navnekonflikter
2. **Company ID:** Alle filer organiseres under selskapets ID
3. **Kategori:** Filer organiseres i mapper basert på type (documents, audits, partners, etc.)
4. **Metadata:** Automatisk lagring av filstørrelse, type, og opplastingsdato

---

## 🛠️ Tekniske Detaljer

### Firebase Storage Initialisering:
```typescript
// src/lib/firebase.ts
import { getStorage } from 'firebase/storage';
storage = getStorage(app);
```

### Opplasting av filer:
```typescript
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const storageRef = ref(storage, `documents/${companyId}/${fileName}`);
await uploadBytes(storageRef, file);
const fileUrl = await getDownloadURL(storageRef);
```

### Sletting av filer:
```typescript
import { deleteObject } from 'firebase/storage';

const storageRef = ref(storage, fileUrl);
await deleteObject(storageRef);
```

---

## 📝 Eksempel: Hvordan en fil lastes opp

1. **Bruker velger fil** i dokumentmodulen
2. **Fil lastes opp** til Firebase Storage under `documents/{companyId}/`
3. **Metadata lagres** i Firestore collection `documents`
4. **Download URL genereres** og lagres i metadata
5. **Fil er tilgjengelig** for alle autoriserte brukere i selskapet

---

## 🎯 Oppsummering

✅ **Alle filer lagres i Firebase Storage** (Google Cloud Storage)  
✅ **Organisert etter selskap** (`companyId`) for GDPR-kompatibilitet  
✅ **Metadata i Firestore** for rask søking og filtrering  
✅ **Automatisk organisering** i mapper basert på filtype  
✅ **Sikker tilgangskontroll** basert på brukerroller  
✅ **Ubegrenset lagringskapasitet** (betales per GB)  
✅ **Automatisk backup** av Google Cloud  

---

## 🔍 Hvor ser jeg filene mine?

1. **I Firebase Console:**
   - Gå til [Firebase Console](https://console.firebase.google.com)
   - Velg prosjektet ditt
   - Gå til "Storage" i venstre meny
   - Se alle filer organisert i mapper

2. **I DriftPro-applikasjonen:**
   - **Dokumenter:** Dashboard → Dokumenter
   - **Revisjoner:** Dashboard → Revisjoner
   - **Selskap-filer:** Dashboard → Selskaper → [Velg selskap] → Filer
   - **Partner-filer:** Dashboard → Samarbeidspartnere → [Velg partner] → Filer
   - **Chat-filer:** Dashboard → Chat → [Velg chat] → Vedlegg

---

## ⚠️ Viktig

- **Ikke slett filer direkte fra Firebase Console** uten å også slette metadata i Firestore
- **Bruk alltid applikasjonens slett-funksjon** for å sikre at både fil og metadata slettes
- **Filer slettes automatisk** når du sletter dokumenter/revisjoner/partnere i applikasjonen

---

**Oppdatert:** 2024  
**Versjon:** 2.0

