import { NextRequest, NextResponse } from 'next/server';
import { brrgService } from '@/lib/brrg-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    console.log('BRRG API called with query:', query);

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    // Check if query looks like an organization number (9 digits)
    if (/^\d{9}$/.test(query)) {
      // Search by organization number
      console.log('Searching BRRG by organization number:', query);
      const company = await brrgService.getCompanyInfo(query);
      
      if (company) {
        console.log('Found company in BRRG:', company);
        return NextResponse.json({
          results: [company],
          total: 1,
          query: query
        });
      } else {
        console.log('Company not found in BRRG for org number:', query);
        return NextResponse.json({
          results: [],
          total: 0,
          query: query
        });
      }
    } else {
      // Search by company name
      console.log('Searching BRRG by company name:', query);
      const companies = await brrgService.searchCompanies(query);
      
      console.log('Found companies in BRRG:', companies);
      return NextResponse.json({
        results: companies,
        total: companies.length,
        query: query
      });
    }

  } catch (error) {
    console.error('BRRG search error:', error);
    return NextResponse.json(
      { error: 'Internal server error during BRRG search' },
      { status: 500 }
    );
  }
} 