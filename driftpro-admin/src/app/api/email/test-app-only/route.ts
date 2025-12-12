import { NextRequest, NextResponse } from 'next/server';
import { microsoftGraphAppOnlyService } from '@/lib/microsoft-graph-app-only-service';

/**
 * Test endpoint for app-only email sending
 * GET /api/email/test-app-only?to=test@example.com
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const testEmail = searchParams.get('to') || 'test@example.com';

    // Check if service is configured
    if (!microsoftGraphAppOnlyService.isConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'App-only authentication ikke konfigurert',
        details: {
          hasTenantId: !!process.env.GRAPH_TENANT_ID,
          hasClientId: !!process.env.GRAPH_CLIENT_ID,
          hasClientSecret: !!process.env.GRAPH_CLIENT_SECRET,
          hasSenderUpn: !!process.env.GRAPH_SENDER_UPN,
        }
      }, { status: 500 });
    }

    const senderUpn = process.env.GRAPH_SENDER_UPN || process.env.NEXT_PUBLIC_GRAPH_SENDER_EMAIL;
    if (!senderUpn) {
      return NextResponse.json({
        success: false,
        error: 'GRAPH_SENDER_UPN ikke satt',
        details: {
          envVars: {
            GRAPH_SENDER_UPN: process.env.GRAPH_SENDER_UPN,
            NEXT_PUBLIC_GRAPH_SENDER_EMAIL: process.env.NEXT_PUBLIC_GRAPH_SENDER_EMAIL,
          }
        }
      }, { status: 500 });
    }

    // Try to get access token
    let tokenError = null;
    try {
      const token = await microsoftGraphAppOnlyService.getAccessToken();
      console.log('✅ Token obtained successfully');
    } catch (error) {
      tokenError = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Token error:', tokenError);
    }

    // Try to send test email
    try {
      await microsoftGraphAppOnlyService.sendEmail(
        senderUpn,
        testEmail,
        'Test e-post fra DriftPro',
        '<h1>Test e-post</h1><p>Dette er en test e-post fra DriftPro app-only autentisering.</p>',
        'html'
      );

      return NextResponse.json({
        success: true,
        message: 'Test e-post sendt!',
        details: {
          to: testEmail,
          from: senderUpn,
          tokenObtained: !tokenError,
          tokenError: tokenError || null
        }
      });
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Kunne ikke sende e-post',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          tokenError: tokenError,
          senderUpn,
          testEmail
        }
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Ukjent feil',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}

