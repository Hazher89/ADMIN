import { useState, useEffect } from 'react';

/**
 * Hook to detect if device is mobile
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

/**
 * Mobile-specific styles
 */
export const mobileStyles = {
  container: {
    width: '100%',
    maxWidth: '100%',
    overflowX: 'hidden' as const,
    padding: '0.5rem 0.75rem',
  },
  card: {
    borderRadius: '0.875rem',
    padding: '1rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    background: 'var(--card-background)',
    border: '1px solid var(--border-color)',
    marginBottom: '0.75rem',
  },
  header: {
    fontSize: '1.125rem',
    fontWeight: 600,
    lineHeight: '1.3',
    letterSpacing: '-0.01em',
    marginBottom: '0.75rem',
  },
  button: {
    padding: '0.75rem 1rem',
    fontSize: '0.9375rem',
    fontWeight: 500,
    borderRadius: '0.625rem',
    minHeight: '44px',
    width: '100%',
  },
  input: {
    fontSize: '16px',
    padding: '0.875rem',
    borderRadius: '0.5rem',
  },
  statCard: {
    borderRadius: '0.875rem',
    padding: '1rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    background: 'var(--card-background)',
    border: '1px solid var(--border-color)',
  },
  listItem: {
    padding: '0.875rem 0.75rem',
    borderRadius: '0.75rem',
    marginBottom: '0.5rem',
  },
};

