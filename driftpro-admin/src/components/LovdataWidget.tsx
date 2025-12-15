'use client';

import React, { useState, useEffect } from 'react';
import { lovdataService, LovdataDocument } from '@/lib/lovdata-service';
import { Scale } from 'lucide-react';

interface LovdataWidgetProps {
  compact?: boolean;
}

export default function LovdataWidget({ compact = false }: LovdataWidgetProps) {
  const [laws, setLaws] = useState<LovdataDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    
    // Auto-refresh every 4 hours
    const interval = setInterval(() => {
      loadData(true);
    }, 4 * 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      // Get ALL relevant laws (not filtered)
      const allLaws = await lovdataService.getRelevantLaws();
      setLaws(allLaws);
    } catch (err) {
      console.error('Error loading Lovdata:', err);
      // Set some default laws if service fails
      setLaws([
        {
          id: 'gdpr',
          title: 'Personvernforordningen (GDPR)',
          type: 'regulation',
          identifier: 'EU 2016/679',
          description: 'Generell databeskyttelsesforordning',
          publishedDate: '2018-05-25',
          relevance: 'high',
          categories: ['Personvern', 'GDPR', 'Compliance'],
          url: 'https://lovdata.no/lov/2018-06-15-44',
          relevantForCompany: true,
        },
        {
          id: 'arbeidsmiljoloven',
          title: 'Arbeidsmiljøloven',
          type: 'law',
          identifier: 'LOV-2005-06-17-62',
          description: 'Lov om arbeidsmiljø, arbeidstid og stillingsvern m.m.',
          publishedDate: '2005-06-17',
          relevance: 'high',
          categories: ['Arbeidsrett', 'HR', 'Sikkerhet'],
          url: 'https://lovdata.no/lov/2005-06-17-62',
          relevantForCompany: true,
        },
        {
          id: 'personopplysningsloven',
          title: 'Personopplysningsloven',
          type: 'law',
          identifier: 'LOV-2018-06-15-38',
          description: 'Lov om behandling av personopplysninger',
          publishedDate: '2018-06-15',
          relevance: 'high',
          categories: ['Personvern', 'GDPR', 'Compliance'],
          url: 'https://lovdata.no/lov/2018-06-15-38',
          relevantForCompany: true,
        },
        {
          id: 'arbeidsgiveransvarloven',
          title: 'Arbeidsgiveransvarloven',
          type: 'law',
          identifier: 'LOV-2005-06-10-41',
          description: 'Lov om arbeidsgiveransvar',
          publishedDate: '2005-06-10',
          relevance: 'high',
          categories: ['Arbeidsrett', 'HR'],
          url: 'https://lovdata.no/lov/2005-06-10-41',
          relevantForCompany: true,
        },
      ]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  if (compact) {
    return null;
  }

  // Create ticker items showing ACTUAL law names and descriptions
  const tickerItems: string[] = [];
  
  // Add actual law names - show ALL laws
  laws.forEach(law => {
    // Show: "Personvernforordningen (GDPR) - Generell databeskyttelsesforordning"
    tickerItems.push(`${law.title} - ${law.description}`);
  });

  // If no laws yet but not loading, show nothing
  if (loading && laws.length === 0) {
    return null;
  }

  // If still no laws after loading, show nothing
  if (tickerItems.length === 0) {
    return null;
  }

  // Create ONE long continuous line of text with actual law names
  const tickerText = tickerItems.join(' • ');

  return (
    <>
      <style jsx global>{`
        @keyframes ticker-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .ticker-scroll {
          animation: ticker-scroll 120s linear infinite;
          display: inline-block;
          white-space: nowrap;
        }
      `}</style>
      <div className="relative w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 overflow-hidden h-12 flex items-center shadow-lg">
        {/* Label */}
        <div className="absolute left-0 top-0 h-full bg-blue-700 px-6 flex items-center gap-2 z-10 shadow-xl flex-shrink-0">
          <Scale className="w-5 h-5 text-white" />
          <span className="text-white font-bold text-sm whitespace-nowrap uppercase">LOVER OG REGLER:</span>
        </div>

        {/* Ticker Container - ONE single line */}
        <div className="flex-1 ml-40 overflow-hidden h-full">
          <div className="h-full flex items-center">
            <span className="ticker-scroll text-sm font-medium text-white">
              {tickerText} • {tickerText}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
