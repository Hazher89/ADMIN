import { NextRequest, NextResponse } from 'next/server';
import { microsoftGraphAppOnlyService } from '@/lib/microsoft-graph-app-only-service';

/**
 * List files in OneDrive folder using app-only authentication
 * GET /api/onedrive/list?folderPath=DriftPro/documents&userUpn=service@company.com
 */
export async function GET(request: NextRequest) {
  try {
    if (!microsoftGraphAppOnlyService.isConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'OneDrive app-only authentication er ikke konfigurert.',
        },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const folderPath = searchParams.get('folderPath') || 'root';
    const userUpn =
      searchParams.get('userUpn') ||
      process.env.GRAPH_SENDER_UPN ||
      process.env.NEXT_PUBLIC_GRAPH_SENDER_EMAIL;

    if (!userUpn) {
      return NextResponse.json(
        {
          success: false,
          error: 'GRAPH_SENDER_UPN eller userUpn parameter må være satt.',
        },
        { status: 400 }
      );
    }

    const files = await microsoftGraphAppOnlyService.listOneDriveFiles(
      userUpn,
      folderPath
    );

    return NextResponse.json({
      success: true,
      files,
      folderPath,
    });
  } catch (error) {
    console.error('❌ OneDrive list feilet:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Ukjent feil',
      },
      { status: 500 }
    );
  }
}
