# DriftPro Admin - Deployment Guide

Denne guiden vil hjelpe deg med å deploye DriftPro Admin systemet til Netlify.

## 🚀 Snabb Deployment

### 1. Forberedelser

- Node.js 18+ installert
- Git installert
- Netlify konto
- Firebase prosjekt

### 2. Firebase Setup

1. **Opprett Firebase Prosjekt**
   - Gå til [Firebase Console](https://console.firebase.google.com/)
   - Klikk "Add project"
   - Gi prosjektet et navn (f.eks. "driftpro-admin")
   - Følg setup wizard

2. **Aktiver Services**
   - **Authentication**: Email/Password
   - **Firestore Database**: Start i test mode
   - **Storage**: Start i test mode
   - **Messaging**: Aktiver push notifications

3. **Hent Konfigurasjon**
   - Gå til Project Settings
   - Scroll ned til "Your apps"
   - Klikk "Add app" → Web
   - Registrer app og kopier konfigurasjon

### 3. Lokal Utvikling

```bash
# Klon repositoriet
git clone https://github.com/your-username/driftpro-admin.git
cd driftpro-admin

# Installer avhengigheter
npm install

# Kopier environment template
cp env.example .env.local

# Rediger .env.local med dine Firebase-opplysninger
nano .env.local

# Start utviklingsserver
npm run dev
```

### 4. Netlify Deployment

#### Metode 1: Netlify CLI (Anbefalt)

```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Login til Netlify
netlify login

# Initialiser Netlify i prosjektet
netlify init

# Følg instruksjonene og velg:
# - "Create & configure a new site"
# - Build command: npm run build
# - Publish directory: out
# - Functions directory: (la stå tomt)

# Sett environment variables
netlify env:set NEXT_PUBLIC_FIREBASE_API_KEY "your_api_key"
netlify env:set NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN "your_project.firebaseapp.com"
netlify env:set NEXT_PUBLIC_FIREBASE_PROJECT_ID "your_project_id"
netlify env:set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET "your_project.appspot.com"
netlify env:set NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID "123456789"
netlify env:set NEXT_PUBLIC_FIREBASE_APP_ID "your_app_id"

# Deploy
netlify deploy --prod
```

#### Metode 2: Netlify Dashboard

1. **Push til GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Netlify Dashboard**
   - Gå til [Netlify Dashboard](https://app.netlify.com/)
   - Klikk "New site from Git"
   - Velg GitHub og ditt repositorium
   - Konfigurer build settings:
     - Build command: `npm run build`
     - Publish directory: `out`
   - Klikk "Deploy site"

3. **Environment Variables**
   - Gå til Site settings → Environment variables
   - Legg til alle Firebase-variabler

### 5. Custom Domain (Valgfritt)

1. **I Netlify Dashboard**
   - Gå til Site settings → Domain management
   - Klikk "Add custom domain"
   - Følg instruksjonene for DNS-konfigurasjon

2. **SSL Certificate**
   - Netlify håndterer SSL automatisk
   - Aktiver "Force HTTPS" i Domain settings

## 🔧 Konfigurasjon

### Firebase Security Rules

#### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User can read their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Admin can read all data
    match /{document=**} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Department leaders can read department data
    match /departments/{departmentId} {
      allow read: if request.auth != null && 
        resource.data.leaderIds[request.auth.uid] != null;
    }
  }
}
```

#### Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Environment Variables

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here

# App Configuration
NEXT_PUBLIC_APP_NAME=DriftPro Admin
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## 🚨 Troubleshooting

### Vanlige Problemer

1. **Build feiler**
   ```bash
   # Sjekk Node.js versjon
   node --version  # Skal være 18+
   
   # Rens cache
   npm run clean
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Firebase connection feiler**
   - Sjekk at alle environment variables er satt
   - Verifiser Firebase prosjekt konfigurasjon
   - Sjekk Firestore rules

3. **Netlify deploy feiler**
   ```bash
   # Test build lokalt
   npm run build
   
   # Sjekk Netlify logs
   netlify logs
   ```

### Debug Mode

```bash
# Aktiver debug logging
DEBUG=* npm run dev

# Sjekk Netlify build logs
netlify build --debug
```

## 📊 Monitoring

### Netlify Analytics
- Gå til Site settings → Analytics
- Aktiver "Analytics" for å spore besøk

### Firebase Analytics
- Aktiver i Firebase Console
- Se brukeradferd og performance

### Error Tracking
- Firebase Crashlytics for JavaScript errors
- Netlify function logs for serverless errors

## 🔄 Continuous Deployment

### GitHub Actions (Automatisk)

1. **Sett opp Secrets i GitHub**
   - Gå til repository settings → Secrets
   - Legg til:
     - `NETLIFY_AUTH_TOKEN`
     - `NETLIFY_SITE_ID`
     - Alle Firebase environment variables

2. **Push til main branch**
   - Alle endringer deployes automatisk
   - Se status i GitHub Actions tab

### Manual Deployment

```bash
# Build og deploy manuelt
npm run build
netlify deploy --prod
```

## 🛡️ Sikkerhet

### HTTPS
- Netlify håndterer SSL automatisk
- Aktiver "Force HTTPS" i domain settings

### Headers
- Security headers er konfigurert i `netlify.toml`
- CSP, XSS protection, etc.

### Environment Variables
- Aldri commit `.env.local` til Git
- Bruk Netlify environment variables for produksjon

## 📱 Mobile App Integration

### Firebase Configuration
- Del samme Firebase prosjekt mellom web og mobile
- Samme authentication og database

### Push Notifications
- Konfigurer Firebase Cloud Messaging
- Test med mobile apper

## 🎯 Performance Optimization

### Build Optimization
```bash
# Analyser bundle size
npm run analyze

# Optimize images
npm run optimize-images
```

### Caching
- Netlify håndterer caching automatisk
- Firebase caching for database queries

### CDN
- Netlify CDN for statiske filer
- Firebase CDN for storage

## 📞 Support

Hvis du støter på problemer:

1. **Sjekk dokumentasjonen**
2. **Se troubleshooting seksjonen**
3. **Kontakt support**: support@driftpro.no
4. **GitHub Issues**: Opprett issue i repositoriet

---

**DriftPro Admin** - Deployment Guide v1.0 🚀 