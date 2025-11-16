'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Topbar from './Topbar';
import BottomNav from './BottomNav';
import CommandPalette from './CommandPalette';

export default function AppShell({ children }: { children: React.ReactNode }) {
	const [open, setOpen] = useState(false);
	const [cockpitActive, setCockpitActive] = useState(false);
	const pathname = usePathname();
	const { isAuthenticated } = useAuth();
	
	// Check if cockpit is active - only on advanced-planning page
	useEffect(() => {
		const checkCockpit = () => {
			// Only hide Topbar if we're on advanced-planning page AND cockpit is active
			const isAdvancedPlanning = pathname === '/dashboard/advanced-planning';
			const active = sessionStorage.getItem('cockpitActive') === 'true';
			setCockpitActive(isAdvancedPlanning && active);
		};
		
		checkCockpit();
		// Check periodically in case it changes
		const interval = setInterval(checkCockpit, 100);
		
		return () => clearInterval(interval);
	}, [pathname]);
	
	// Don't show Topbar, BottomNav, or CommandPalette on login page, when not authenticated, or when cockpit is active
	const isLoginPage = pathname === '/login' || pathname === '/forgot-password' || pathname === '/setup-password';
	const shouldShowShell = !isLoginPage && isAuthenticated && !cockpitActive;

	useEffect(() => {
		const onResize = () => {
			if (window.innerWidth > 1024) {
				setOpen(true);
			} else {
				setOpen(false);
			}
		};
		onResize();
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	}, []);

	// If login page or not authenticated, render children only without shell
	if (!shouldShowShell) {
		return <>{children}</>;
	}

	return (
		<div>
			<Topbar />
			<main className="main-content" style={{ paddingTop: 16, paddingBottom: 64 }}>
				{children}
			</main>
			{/* Mobile bottom navigation */}
			<div className="mobile-only" style={{ display: 'none' }}>
				<BottomNav />
			</div>
			<CommandPalette />
		</div>
	);
}


