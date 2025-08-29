// Test Real SMS via Sveve API
const { SveveSMSService } = require('./src/lib/sveve-sms-service.ts');

async function testRealSMS() {
  console.log('🧪 Testing REAL SMS via Sveve API...');
  
  try {
    const sveve = new SveveSMSService('52656b7364647043795158657963696f', 'DriftPro');
    
    console.log('✅ Sveve service created');
    console.log('📱 API Key:', sveve.apiKey ? '***' + sveve.apiKey.slice(-4) : '❌ Missing');
    console.log('🌐 API URL:', sveve.apiUrl);
    console.log('📝 Default From:', sveve.defaultFrom);
    
    // Test phone number
    const testPhone = '45045451';
    const isValid = sveve.validatePhoneNumber(testPhone);
    const formatted = sveve.formatPhoneNumber(testPhone);
    
    console.log(`\n📞 Phone number test:`);
    console.log(`${testPhone} → ${isValid ? '✅ Valid' : '❌ Invalid'} → ${formatted}`);
    
    if (!isValid) {
      console.log('❌ Cannot send SMS - invalid phone number');
      return;
    }
    
    // Send test SMS
    console.log('\n📱 Sending test SMS...');
    const smsResult = await sveve.sendSMS({
      to: formatted,
      message: '🧪 Test SMS fra DriftPro via Sveve API! Dette er en test for å verifisere at SMS-funksjonen fungerer.',
      priority: 'normal'
    });
    
    console.log('\n📱 SMS Result:', smsResult);
    
    if (smsResult.success) {
      console.log('✅ SMS sent successfully!');
      console.log('📋 Message ID:', smsResult.messageId);
      console.log('💰 Cost:', smsResult.cost, 'NOK');
    } else {
      console.log('❌ SMS failed to send');
      console.log('🚨 Error:', smsResult.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRealSMS();
