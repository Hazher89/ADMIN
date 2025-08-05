import { NextRequest, NextResponse } from 'next/server';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCyE4S4B5q2JLdtaTtr8kVVvg8y-3Zm7ZE",
  authDomain: "driftpro-40ccd.firebaseapp.com",
  projectId: "driftpro-40ccd",
  storageBucket: "driftpro-40ccd.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includePassword = searchParams.get('includePassword') === 'true';

    const emailSettingsRef = doc(db, 'systemSettings', 'email');
    const emailSettingsDoc = await getDoc(emailSettingsRef);

    if (emailSettingsDoc.exists()) {
      const data = emailSettingsDoc.data();
      
      // Return settings with or without password
      const response = {
        enabled: data.enabled ?? true,
        fromEmail: data.fromEmail || 'noreplay@driftpro.no',
        fromName: data.fromName || 'DriftPro System',
        
        // Email type toggles
        adminSetup: data.adminSetup ?? true,
        deviationReports: data.deviationReports ?? true,
        deviationResolved: data.deviationResolved ?? true,
        userWelcome: data.userWelcome ?? true,
        notifications: data.notifications ?? true,
        warnings: data.warnings ?? true,
        systemAlerts: data.systemAlerts ?? true,
        
        // Cloudflare Email Routing settings
        smtpHost: data.smtpHost || 'smtp.cloudflare.com',
        smtpPort: data.smtpPort || 587,
        smtpUser: data.smtpUser || 'noreplay@driftpro.no',
        smtpSecure: data.smtpSecure ?? false,
        smtpPassword: includePassword ? (data.smtpPassword || 'your-cloudflare-api-key') : '[HIDDEN]',
        
        // Advanced settings
        emailQueueEnabled: data.emailQueueEnabled ?? false,
        maxRetryAttempts: data.maxRetryAttempts || 3,
        logAllEmails: data.logAllEmails ?? true,
        
        // Templates
        adminSetupTemplate: data.adminSetupTemplate || 'Hei [adminName], velkommen til [companyName]. Klikk her for å sette opp passord: [setupUrl]',
        deviationReportTemplate: data.deviationReportTemplate || 'Avviksrapport: [deviationTitle] - [message]',
        notificationTemplate: data.notificationTemplate || 'Varsel: [subject] - [message]',
        userWelcomeTemplate: data.userWelcomeTemplate || 'Velkommen [userName] til [companyName]! Logg inn her: [loginUrl]',
        warningTemplate: data.warningTemplate || 'ADVARSEL: [warningType] - [description]. Handling kreves: [action]',
        
        // Analytics
        analyticsEnabled: data.analyticsEnabled ?? false,
        trackOpenRates: data.trackOpenRates ?? false,
        trackClickRates: data.trackClickRates ?? false,
        
        // Spam protection
        spamProtection: data.spamProtection || {
          enabled: true,
          maxRecipients: 50
        },
        
        // Backup SMTP
        backupSmtpEnabled: data.backupSmtpEnabled ?? false,
        backupSmtpHost: data.backupSmtpHost || '',
        backupSmtpPort: data.backupSmtpPort || 587,
        
        // Cloudflare Email Routing specific
        provider: data.provider || 'cloudflare_email_routing',
        tls: data.tls || { rejectUnauthorized: false },
        connectionTimeout: data.connectionTimeout || 60000,
        greetingTimeout: data.greetingTimeout || 30000,
        socketTimeout: data.socketTimeout || 60000
      };

      return NextResponse.json(response);
    } else {
      // Return default Cloudflare Email Routing settings
      const defaultSettings = {
        enabled: true,
        fromEmail: 'noreplay@driftpro.no',
        fromName: 'DriftPro System',
        
        // Email type toggles
        adminSetup: true,
        deviationReports: true,
        deviationResolved: true,
        userWelcome: true,
        notifications: true,
        warnings: true,
        systemAlerts: true,
        
        // Cloudflare Email Routing settings
        smtpHost: 'smtp.cloudflare.com',
        smtpPort: 587,
        smtpUser: 'noreplay@driftpro.no',
        smtpSecure: false,
        smtpPassword: includePassword ? 'your-cloudflare-api-key' : '[HIDDEN]',
        
        // Advanced settings
        emailQueueEnabled: false,
        maxRetryAttempts: 3,
        logAllEmails: true,
        
        // Templates
        adminSetupTemplate: 'Hei [adminName], velkommen til [companyName]. Klikk her for å sette opp passord: [setupUrl]',
        deviationReportTemplate: 'Avviksrapport: [deviationTitle] - [message]',
        notificationTemplate: 'Varsel: [subject] - [message]',
        userWelcomeTemplate: 'Velkommen [userName] til [companyName]! Logg inn her: [loginUrl]',
        warningTemplate: 'ADVARSEL: [warningType] - [description]. Handling kreves: [action]',
        
        // Analytics
        analyticsEnabled: false,
        trackOpenRates: false,
        trackClickRates: false,
        
        // Spam protection
        spamProtection: {
          enabled: true,
          maxRecipients: 50
        },
        
        // Backup SMTP
        backupSmtpEnabled: false,
        backupSmtpHost: '',
        backupSmtpPort: 587,
        
        // Cloudflare Email Routing specific
        provider: 'cloudflare_email_routing',
        tls: { rejectUnauthorized: false },
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000
      };

      return NextResponse.json(defaultSettings);
    }
  } catch (error) {
    console.error('Error getting email settings:', error);
    return NextResponse.json(
      { error: 'Failed to get email settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const emailSettingsRef = doc(db, 'systemSettings', 'email');
    
    // Prepare settings with Cloudflare Email Routing defaults
    const settings = {
      ...body,
      provider: 'cloudflare_email_routing',
      updatedAt: new Date().toISOString()
    };

    await setDoc(emailSettingsRef, settings, { merge: true });

    return NextResponse.json({ 
      success: true, 
      message: 'Email settings updated successfully',
      provider: 'cloudflare_email_routing'
    });
  } catch (error) {
    console.error('Error updating email settings:', error);
    return NextResponse.json(
      { error: 'Failed to update email settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const emailSettingsRef = doc(db, 'systemSettings', 'email');
    
    // Force update with Cloudflare Email Routing settings
    const settings = {
      smtpHost: 'smtp.cloudflare.com',
      smtpPort: 587,
      smtpUser: 'noreplay@driftpro.no',
      smtpPassword: 'your-cloudflare-api-key',
      smtpSecure: false,
      fromEmail: 'noreplay@driftpro.no',
      fromName: 'DriftPro System',
      provider: 'cloudflare_email_routing',
      tls: { rejectUnauthorized: false },
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000,
      updatedAt: new Date().toISOString()
    };

    await setDoc(emailSettingsRef, settings, { merge: true });

    return NextResponse.json({ 
      success: true, 
      message: 'Email settings force updated to Cloudflare Email Routing',
      provider: 'cloudflare_email_routing'
    });
  } catch (error) {
    console.error('Error force updating email settings:', error);
    return NextResponse.json(
      { error: 'Failed to force update email settings' },
      { status: 500 }
    );
  }
} 