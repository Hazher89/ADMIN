import { NextRequest, NextResponse } from 'next/server';
import { microsoftGraphAppOnlyService } from '@/lib/microsoft-graph-app-only-service';

/**
 * Upload file to OneDrive using app-only authentication
 * POST /api/onedrive/upload
 * 
 * Body:
 * - file: File (multipart/form-data) or base64 string
 * - folderPath: string (e.g., "DriftPro/documents")
 * - fileName: string (optional, defaults to file name)
 * - userUpn: string (optional, defaults to GRAPH_SENDER_UPN)
 */
export async function POST(request: NextRequest) {
  try {
    if (!microsoftGraphAppOnlyService.isConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'OneDrive app-only authentication er ikke konfigurert. Sett GRAPH_TENANT_ID, GRAPH_CLIENT_ID og GRAPH_CLIENT_SECRET.',
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folderPath = (formData.get('folderPath') as string) || 'DriftPro';
    const fileName = (formData.get('fileName') as string) || file.name;
    const userUpn =
      (formData.get('userUpn') as string) ||
      process.env.GRAPH_SENDER_UPN ||
      process.env.NEXT_PUBLIC_GRAPH_SENDER_EMAIL;

    if (!userUpn) {
      return NextResponse.json(
        {
          success: false,
          error: 'GRAPH_SENDER_UPN eller NEXT_PUBLIC_GRAPH_SENDER_EMAIL må være satt for OneDrive-tilgang.',
        },
        { status: 500 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Fil mangler.' },
        { status: 400 }
      );
    }

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Upload to OneDrive
    const result = await microsoftGraphAppOnlyService.uploadToOneDrive(
      userUpn,
      `${folderPath}/${fileName}`,
      arrayBuffer,
      file.type || 'application/octet-stream'
    );

    return NextResponse.json({
      success: true,
      fileId: result.id,
      fileName: result.name,
      webUrl: result.webUrl,
      downloadUrl: result.downloadUrl,
      size: result.size,
    });
  } catch (error) {
    console.error('❌ OneDrive upload feilet:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Ukjent feil',
      },
      { status: 500 }
    );
  }
}

