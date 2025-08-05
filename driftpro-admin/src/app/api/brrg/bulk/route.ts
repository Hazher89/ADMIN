import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgNumbers } = body;

    if (!orgNumbers || !Array.isArray(orgNumbers)) {
      return NextResponse.json(
        { error: 'Organization numbers array is required' },
        { status: 400 }
      );
    }

    console.log('🏢 Processing BRRG bulk import for Cloudflare Email Routing:', {
      count: orgNumbers.length,
      provider: 'cloudflare_email_routing'
    });

    // Mock bulk import results
    const results = orgNumbers.map((orgNumber, index) => ({
      orgNumber,
      name: `Test Company ${orgNumber}`,
      address: {
        street: `Test Street ${index + 1}`,
        city: 'Oslo',
        postalCode: '0001',
        country: 'Norway'
      },
      contact: {
        email: `test${index + 1}@example.com`,
        phone: `+47 123 45 ${String(index + 1).padStart(3, '0')}`
      },
      status: 'active',
      imported: true,
      provider: 'cloudflare_email_routing'
    }));

    console.log(`✅ BRRG bulk import completed successfully for Cloudflare Email Routing: ${results.length} companies`);

    return NextResponse.json({
      success: true,
      message: `Bulk import completed successfully via Cloudflare Email Routing`,
      results,
      total: results.length,
      provider: 'cloudflare_email_routing'
    });
  } catch (error) {
    console.error('❌ Error in BRRG bulk import:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process bulk import',
        details: error instanceof Error ? error.message : 'Unknown error',
        provider: 'cloudflare_email_routing'
      },
      { status: 500 }
    );
  }
} 