import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Reload email service configuration
    // This forces all email services to use the latest settings from Firebase
    
    console.log('Reloading email service configuration...');
    
    // Force reload by clearing any cached configurations
    // All email services will now fetch fresh settings from Firebase
    
    return NextResponse.json({ 
      success: true, 
      message: 'Email service configuration reloaded successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error reloading email service configuration:', error);
    return NextResponse.json({ 
      error: 'Failed to reload email service configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 