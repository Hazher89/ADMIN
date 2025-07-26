const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// Email configuration
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.pass
  }
});

// Cloud Function to send invitation email when company is created
exports.sendInvitationEmail = functions.firestore
  .document('invitations/{invitationId}')
  .onCreate(async (snap, context) => {
    const invitationData = snap.data();
    
    try {
      // Email template
      const mailOptions = {
        from: '"DriftPro Admin" <noreply@driftpro.no>',
        to: invitationData.adminEmail,
        subject: 'Velkommen til DriftPro - Sett opp ditt passord',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🏢 DriftPro</h1>
              <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Bedriftsadministrasjon</p>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-bottom: 20px;">Velkommen til DriftPro!</h2>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                Hei ${invitationData.adminName}!<br>
                Du har blitt utnevnt som administrator for <strong>${invitationData.companyName || 'din bedrift'}</strong> i DriftPro.
              </p>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
                For å komme i gang må du sette opp ditt passord. Klikk på knappen nedenfor for å komme i gang:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${invitationData.invitationLink}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 15px 30px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          font-weight: bold; 
                          display: inline-block;
                          box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  🚀 Sett opp passord
                </a>
              </div>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                <strong>Viktig:</strong> Denne lenken er kun gyldig én gang og utløper om 24 timer.
              </p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 30px;">
                <h3 style="color: #333; margin-bottom: 15px;">Hva kan du gjøre som administrator?</h3>
                <ul style="color: #666; line-height: 1.6; margin: 0; padding-left: 20px;">
                  <li>Administrere ansatte og avdelinger</li>
                  <li>Håndtere vakter og skjemaer</li>
                  <li>Se rapporter og statistikk</li>
                  <li>Administrere dokumenter og chat</li>
                </ul>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
              <p>Denne e-posten ble sendt automatisk fra DriftPro Admin systemet.</p>
              <p>Hvis du ikke forventet denne e-posten, kan du trygt ignorere den.</p>
            </div>
          </div>
        `
      };
      
      // Send email
      const result = await transporter.sendMail(mailOptions);
      console.log('Invitation email sent successfully:', result);
      
      // Update invitation document with email sent status
      await snap.ref.update({
        emailSent: true,
        emailSentAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return result;
      
    } catch (error) {
      console.error('Error sending invitation email:', error);
      
      // Update invitation document with error status
      await snap.ref.update({
        emailSent: false,
        emailError: error.message,
        emailErrorAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      throw error;
    }
  });
