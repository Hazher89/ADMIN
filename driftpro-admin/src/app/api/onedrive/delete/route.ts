import { NextRequest, NextResponse } from 'next/server';
import { microsoftGraphAppOnlyService } from '@/lib/microsoft-graph-app-only-service';

/**
 * Delete file from OneDrive using app-only authentication
 * DELETE /api/onedrive/delete
 * 
 * Body:
 * - itemId: string (OneDrive item ID)
 * - userUpn: string (optional, defaults to GRAPH_SENDER_UPN)
 */
export async function DELETE(request: NextRequest) {
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

    const body = await request.json();
    const { itemId, userUpn } = body;

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: 'itemId mangler.' },
        { status: 400 }
      );
    }

    const targetUserUpn =
      userUpn ||
      process.env.GRAPH_SENDER_UPN ||
      process.env.NEXT_PUBLIC_GRAPH_SENDER_EMAIL;

    if (!targetUserUpn) {
      return NextResponse.json(
        {
          success: false,
          error: 'GRAPH_SENDER_UPN eller userUpn må være satt.',
        },
        { status: 400 }
      );
    }

    await microsoftGraphAppOnlyService.deleteFromOneDrive(
      targetUserUpn,
      itemId
    );

    return NextResponse.json({
      success: true,
      message: 'Fil slettet fra OneDrive',
    });
  } catch (error) {
    console.error('❌ OneDrive delete feilet:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Ukjent feil',
      },
      { status: 500 }
    );
  }
}
