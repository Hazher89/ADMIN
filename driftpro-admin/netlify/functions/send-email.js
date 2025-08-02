const nodemailer = require('nodemailer');

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { emailData, config } = JSON.parse(event.body);

    if (!emailData) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'emailData is required' })
      };
    }

    // Create transporter with the provided config or use defaults
    const transporter = nodemailer.createTransporter({
      host: config?.smtpHost || 'smtp.domeneshop.no',
      port: config?.smtpPort || 587,
      secure: false, // Use TLS
      auth: {
        user: config?.smtpUser || 'noreply@driftpro.no',
        pass: config?.smtpPass || 'HazGada1989!'
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Prepare email
    const mailOptions = {
      from: `${config?.senderName || 'DriftPro'} <${config?.senderEmail || 'noreply@driftpro.no'}>`,
      to: Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to,
      subject: emailData.subject,
      html: emailData.body
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        messageId: info.messageId 
      })
    };

  } catch (error) {
    console.error('Error sending email:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error' 
      })
    };
  }
}; 