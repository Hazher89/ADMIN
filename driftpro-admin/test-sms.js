// Test Sveve SMS Service
const { SveveSMSService } = require('./src/lib/sveve-sms-service.ts');

async function testSMS() {
  console.log('🧪 Testing Sveve SMS Service...');
  
  try {
    const sveve = new SveveSMSService('f90dad0a438d0f0', 'DriftPro');
    
    console.log('✅ Sveve service created');
    console.log('📱 API Key:', sveve.apiKey ? '***' + sveve.apiKey.slice(-4) : '❌ Missing');
    console.log('🌐 API URL:', sveve.apiUrl);
    console.log('📝 Default From:', sveve.defaultFrom);
    
    // Test various phone number formats
    const testPhones = [
      '+4745045451',  // Valid: +47 + 45045451
      '4745045451',   // Valid: 47 + 45045451
      '004745045451', // Valid: 0047 + 45045451
      '45045451',     // Valid: 45045451 (8 digits, starts with 4)
      '91234567',     // Valid: 91234567 (8 digits, starts with 9)
      '12345678',     // Invalid: doesn't start with 4 or 9
      'abc123def'     // Invalid: contains letters
    ];
    
    console.log('\n📞 Testing phone number validation:');
    testPhones.forEach(phone => {
      const isValid = sveve.validatePhoneNumber(phone);
      const formatted = sveve.formatPhoneNumber(phone);
      console.log(`${phone} → ${isValid ? '✅ Valid' : '❌ Invalid'} → ${formatted}`);
    });
    
    // Test cost estimation
    const cost = sveve.getSMSCostEstimate(160, 1);
    console.log('\n💰 Cost estimation test:', cost, 'NOK for 1 SMS');
    
    console.log('\n🎉 Sveve SMS Service test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSMS();
