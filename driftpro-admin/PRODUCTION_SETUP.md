# Production Setup Guide

## Environment Configuration

### 1. Environment Variables
Create `.env.production` with the following variables:

```bash
# Production Environment Variables
NEXT_PUBLIC_APP_URL=https://admin.driftpro.no
NEXT_PUBLIC_FIREBASE_API_KEY=your-production-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=driftpro-40ccd.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=driftpro-40ccd
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=driftpro-40ccd.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-production-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-production-app-id

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@driftpro.no
SMTP_PASS=your-production-smtp-password

# Security
NEXTAUTH_SECRET=your-production-nextauth-secret
NEXTAUTH_URL=https://admin.driftpro.no

# Analytics
NEXT_PUBLIC_GA_ID=your-production-ga-id

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=your-production-sentry-dsn
```

### 2. Firebase Production Setup

#### Security Rules
Update Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own company's data
    match /users/{userId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == userId || 
         resource.data.companyId == request.auth.token.companyId);
    }
    
    match /departments/{deptId} {
      allow read, write: if request.auth != null && 
        resource.data.companyId == request.auth.token.companyId;
    }
    
    match /shifts/{shiftId} {
      allow read, write: if request.auth != null && 
        resource.data.companyId == request.auth.token.companyId;
    }
    
    match /deviations/{deviationId} {
      allow read, write: if request.auth != null && 
        resource.data.companyId == request.auth.token.companyId;
    }
    
    match /documents/{docId} {
      allow read, write: if request.auth != null && 
        resource.data.companyId == request.auth.token.companyId;
    }
    
    match /timeclocks/{timeclockId} {
      allow read, write: if request.auth != null && 
        resource.data.companyId == request.auth.token.companyId;
    }
    
    match /surveys/{surveyId} {
      allow read, write: if request.auth != null && 
        resource.data.companyId == request.auth.token.companyId;
    }
    
    match /partners/{partnerId} {
      allow read, write: if request.auth != null && 
        resource.data.companyId == request.auth.token.companyId;
    }
    
    match /settings/{settingId} {
      allow read, write: if request.auth != null && 
        resource.data.companyId == request.auth.token.companyId;
    }
    
    match /emailLogs/{logId} {
      allow read, write: if request.auth != null && 
        resource.data.metadata.companyId == request.auth.token.companyId;
    }
  }
}
```

#### Storage Rules
Update Firebase Storage rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /documents/{companyId}/{allPaths=**} {
      allow read, write: if request.auth != null && 
        request.auth.token.companyId == companyId;
    }
    
    match /avatars/{companyId}/{allPaths=**} {
      allow read, write: if request.auth != null && 
        request.auth.token.companyId == companyId;
    }
  }
}
```

### 3. Email Configuration

#### SMTP Setup
Configure Gmail SMTP for noreply@driftpro.no:

1. Enable 2-factor authentication
2. Generate App Password
3. Update SMTP settings in Firebase

#### Email Templates
All email templates are configured in `src/lib/email-service.ts`

### 4. Domain Configuration

#### DNS Records
```
admin.driftpro.no    A     [YOUR_SERVER_IP]
*.driftpro.no        CNAME admin.driftpro.no
```

#### SSL Certificate
Ensure SSL certificate is installed for HTTPS

### 5. Build and Deploy

#### Build Commands
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start production server
npm start
```

#### Deployment Options

##### Vercel (Recommended)
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically on push

##### Netlify
1. Connect repository
2. Set build command: `npm run build`
3. Set publish directory: `out`
4. Configure environment variables

##### Self-hosted
1. Build the application
2. Serve with nginx or Apache
3. Configure reverse proxy

### 6. Monitoring and Analytics

#### Error Tracking
- Configure Sentry for error monitoring
- Set up alerts for critical errors

#### Analytics
- Google Analytics 4
- Firebase Analytics
- Custom event tracking

#### Performance Monitoring
- Core Web Vitals
- Lighthouse scores
- Real User Monitoring (RUM)

### 7. Security Checklist

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Firebase security rules configured
- [ ] CORS settings configured
- [ ] Rate limiting implemented
- [ ] Input validation enabled
- [ ] XSS protection enabled
- [ ] CSRF protection enabled
- [ ] Content Security Policy (CSP) configured

### 8. Backup Strategy

#### Database Backup
- Enable Firebase automatic backups
- Set up daily manual backups
- Test restore procedures

#### File Storage Backup
- Configure Firebase Storage backup
- Set up cross-region replication

### 9. Performance Optimization

#### Build Optimization
- Enable code splitting
- Optimize bundle size
- Enable compression

#### Runtime Optimization
- Implement caching strategies
- Optimize images
- Enable CDN

### 10. Testing

#### Pre-deployment Tests
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Performance tests pass
- [ ] Security tests pass

#### Post-deployment Tests
- [ ] Smoke tests
- [ ] User acceptance tests
- [ ] Performance monitoring
- [ ] Error monitoring

### 11. Maintenance

#### Regular Tasks
- Update dependencies monthly
- Monitor error logs daily
- Review performance metrics weekly
- Backup verification monthly

#### Emergency Procedures
- Rollback procedures documented
- Incident response plan
- Contact information for team members

## Production Features Implemented

### ✅ Complete Features
- [x] **User Authentication** - Firebase Auth with company isolation
- [x] **Employee Management** - Full CRUD with GDPR compliance
- [x] **Department Management** - Complete department system
- [x] **Shift Management** - Full shift scheduling and tracking
- [x] **Deviation Management** - Complete deviation reporting system
- [x] **Document Management** - File upload, storage, and sharing
- [x] **Time Clock** - Complete time tracking system
- [x] **Vacation Management** - Leave request and approval system
- [x] **Chat System** - Real-time messaging between employees
- [x] **Email System** - Automated email notifications
- [x] **Survey System** - Complete survey creation and response system
- [x] **Partner Management** - External partner tracking
- [x] **Settings Management** - System configuration
- [x] **Activity Logging** - Complete audit trail
- [x] **Dashboard Analytics** - Real-time statistics and insights
- [x] **GDPR Compliance** - Complete data isolation and privacy
- [x] **Mobile Responsive** - Works on all devices
- [x] **Real-time Updates** - Live data synchronization
- [x] **Error Handling** - Comprehensive error management
- [x] **Loading States** - Professional user experience
- [x] **Search & Filter** - Advanced data filtering
- [x] **Export Functionality** - Data export capabilities
- [x] **Email Notifications** - Automated welcome emails
- [x] **Password Management** - Secure password setup

### 🚀 Production Ready
- [x] **Scalable Architecture** - Handles multiple companies
- [x] **Security Hardened** - Firebase security rules
- [x] **Performance Optimized** - Efficient queries and caching
- [x] **Error Resilient** - Graceful error handling
- [x] **Monitoring Ready** - Comprehensive logging
- [x] **Backup Strategy** - Data protection
- [x] **Compliance Ready** - GDPR compliant
- [x] **Documentation** - Complete setup guides

## Support

For production support:
- Email: support@driftpro.no
- Phone: +47 XXX XX XXX
- Documentation: https://docs.driftpro.no

Last updated: 2024-08-02 