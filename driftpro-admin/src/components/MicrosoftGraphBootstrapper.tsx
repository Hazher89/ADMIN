'use client';

import { useEffect } from 'react';
import { microsoftGraphService } from '@/lib/microsoft-graph-service';

export default function MicrosoftGraphBootstrapper() {
	useEffect(() => {
		let isMounted = true;
		(async () => {
			try {
				await microsoftGraphService.initializeMSAL();
				// Touch current account to ensure session is restored if present
				microsoftGraphService.getCurrentAccount();
				console.log('🔐 Microsoft Graph ready (bootstrap)');
			} catch (error) {
				if (!isMounted) return;
				console.error('MSAL bootstrap failed:', error);
			}
		})();
		return () => {
			isMounted = false;
		};
	}, []);

	return null;
}






