import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgNumber = searchParams.get('orgNumber');

    if (!orgNumber) {
      return NextResponse.json(
        { error: 'Organization number is required' },
        { status: 400 }
      );
    }

    console.log('🏢 Fetching BRRG data for Cloudflare Email Routing:', {
      orgNumber,
      provider: 'cloudflare_email_routing'
    });

    // Mock BRRG data for testing
    const mockCompanyData = {
      orgNumber: orgNumber,
      name: `Test Company ${orgNumber}`,
      address: {
        street: 'Test Street 123',
        city: 'Oslo',
        postalCode: '0001',
        country: 'Norway'
      },
      contact: {
        email: 'test@example.com',
        phone: '+47 123 45 678'
      },
      status: 'active',
      provider: 'cloudflare_email_routing'
    };

    console.log('✅ BRRG data retrieved successfully for Cloudflare Email Routing');

    return NextResponse.json(mockCompanyData);
  } catch (error) {
    console.error('❌ Error fetching BRRG data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch BRRG data',
        details: error instanceof Error ? error.message : 'Unknown error',
        provider: 'cloudflare_email_routing'
      },
      { status: 500 }
    );
  }
} 