'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
	const [theme, setTheme] = useState<'light' | 'dark'>('light');
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
		const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
		const initialTheme = savedTheme || 'light';
		setTheme(initialTheme);
		if (typeof document !== 'undefined') {
			document.documentElement.setAttribute('data-theme', initialTheme);
		}
	}, []);

	useEffect(() => {
		if (!mounted) return;
		if (typeof document === 'undefined') return;
		document.documentElement.setAttribute('data-theme', theme);
		localStorage.setItem('theme', theme);
	}, [theme, mounted]);

	// Return neutral content during SSR to avoid hydration mismatch
	if (!mounted) {
		return (
			<button
				className="btn btn-secondary"
				style={{ position: 'fixed', right: '1rem', bottom: '1rem', zIndex: 1000 }}
				title="Bytt tema"
				suppressHydrationWarning
			>
				🌙
			</button>
		);
	}

	return (
		<button
			onClick={() => setTheme(prev => (prev === 'light' ? 'dark' : 'light'))}
			className="btn btn-secondary"
			style={{ position: 'fixed', right: '1rem', bottom: '1rem', zIndex: 1000 }}
			title={theme === 'light' ? 'Bytt til mørk modus' : 'Bytt til lys modus'}
			suppressHydrationWarning
		>
			{theme === 'light' ? '🌙 Mørk' : '☀️ Lys'}
		</button>
	);
}


