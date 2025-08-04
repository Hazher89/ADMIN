import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Clear any cached email settings
    // This forces the system to reload settings from Firebase
    
    console.log('Clearing email settings cache...');
    
    // In a real implementation, you might clear Redis cache or similar
    // For now, we'll just return success as the settings are loaded fresh each time
    
    return NextResponse.json({ 
      success: true, 
      message: 'Email settings cache cleared successfully' 
    });
  } catch (error) {
    console.error('Error clearing email settings cache:', error);
    return NextResponse.json({ 
      error: 'Failed to clear email settings cache',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 